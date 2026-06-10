import productModel from "../models/productModel.js";
import stockLogModel from "../models/stockLogModel.js";

export const DEFAULT_LOW_STOCK_THRESHOLD = 10;

export const getEffectiveStock = (product) => {
  // If product has variants, calculate stock from variants
  if (product?.hasVariants && product?.variants && Array.isArray(product.variants)) {
    const variantStock = product.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    return Math.max(0, variantStock);
  }
  // Otherwise use top-level stock or quantity field
  const stock = product?.stock ?? product?.quantity;
  return Math.max(0, Number(stock) || 0);
};

export const getEffectiveThreshold = (product) => {
  const t = product?.lowStockThreshold;
  return t != null && t >= 0 ? Number(t) : DEFAULT_LOW_STOCK_THRESHOLD;
};

export const getStockStatus = (stock, threshold) => {
  if (stock <= 0) return "out";
  if (stock <= threshold) return "low";
  return "in";
};

const formatProductRow = (product) => {
  const stock = getEffectiveStock(product);
  const threshold = getEffectiveThreshold(product);
  return {
    _id: product._id,
    name: product.name,
    category: product.category,
    brand: product.brand,
    price: product.price,
    stock,
    lowStockThreshold: threshold,
    soldQuantity: product.soldQuantity || 0,
    isAvailable: product.isAvailable !== false,
    status: getStockStatus(stock, threshold),
    image:
      product.images?.length > 0 ? product.images[0] : product.image || "",
    hasVariants: product.hasVariants || false,
    variants: product.variants || [],
    updatedAt: product.updatedAt,
  };
};

const writeStockLog = async ({
  product,
  type,
  quantityChange,
  stockBefore,
  stockAfter,
  note,
  req,
}) => {
  await stockLogModel.create({
    productId: product._id,
    productName: product.name,
    type,
    quantityChange,
    stockBefore,
    stockAfter,
    note: note || "",
    createdBy: req.user?.id,
    createdByName: req.user?.name || req.user?.email || "Admin",
  });
};

const syncAvailability = (product) => {
  if (getEffectiveStock(product) <= 0) {
    product.isAvailable = false;
  } else if (product.isAvailable === false) {
    product.isAvailable = true;
  }
};

/** GET /api/product/inventory */
export const getInventoryOverview = async (req, res) => {
  try {
    const { status, search } = req.query;
    const products = await productModel.find({}).sort({ name: 1 }).lean();

    // Sold quantity source of truth: product.soldQuantity
    // Because order deletion/restoration logic updates product.soldQuantity.
    let rows = products.map((p) => {
      const row = formatProductRow(p);
      row.soldQuantity = p.soldQuantity || 0;
      return row;
    });

    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q)
      );
    }

    if (status && status !== "all") {
      rows = rows.filter((p) => p.status === status);
    }

    const allRows = products.map(formatProductRow);
    const stats = {
      totalProducts: allRows.length,
      lowStock: allRows.filter((p) => p.status === "low").length,
      outOfStock: allRows.filter((p) => p.status === "out").length,
      inStock: allRows.filter((p) => p.status === "in").length,
      totalUnits: allRows.reduce((s, p) => s + p.stock, 0),
    };

    const lowStockItems = allRows
      .filter((p) => p.status === "low" || p.status === "out")
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 10);

    res.json({
      success: true,
      stats,
      products: rows,
      lowStockItems,
    });
  } catch (error) {
    console.log("getInventoryOverview error:", error);
    res.json({ success: false, message: error.message });
  }
};

/** GET /api/product/inventory/logs */
export const getStockLogs = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
    const logs = await stockLogModel
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ success: true, logs });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/** POST /api/product/inventory/import — nhập hàng */
export const importStock = async (req, res) => {
  try {
    const { productId, quantity, note } = req.body;
    const qty = parseInt(quantity, 10);

    if (!productId || !qty || qty <= 0) {
      return res.json({
        success: false,
        message: "Chọn sản phẩm và số lượng nhập (> 0)",
      });
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return res.json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    const before = getEffectiveStock(product);
    
    // If product has variants, distribute the import across variants or add to first variant
    if (product.hasVariants && product.variants && product.variants.length > 0) {
      // Add to the first variant for simplicity, or distribute evenly
      product.variants[0].stock = (product.variants[0].stock || 0) + qty;
      // Recalculate total stock from variants
      product.stock = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    } else {
      product.stock = before + qty;
    }
    
    if (product.quantity != null) product.quantity = product.stock;
    syncAvailability(product);
    await product.save();

    await writeStockLog({
      product,
      type: "import",
      quantityChange: qty,
      stockBefore: before,
      stockAfter: product.stock,
      note,
      req,
    });

    res.json({
      success: true,
      message: `Đã nhập ${qty} sp — tồn kho: ${product.stock}`,
      product: formatProductRow(product.toObject()),
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/** POST /api/product/inventory/adjust — điều chỉnh +/- */
export const adjustStock = async (req, res) => {
  try {
    const { productId, change, note, size, color } = req.body;
    const delta = parseInt(change, 10);

    if (!productId || delta === 0 || Number.isNaN(delta)) {
      return res.json({
        success: false,
        message: "Nhập số thay đổi khác 0 (+ nhập thêm, − xuất bớt)",
      });
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return res.json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    const before = getEffectiveStock(product);
    
    // If size and color are provided, adjust specific variant
    if (size && color) {
      if (!product.hasVariants) {
        product.hasVariants = true;
        product.variants = [];
      }
      
      // Find or create the variant
      let variant = product.variants.find(v => v.size === size && v.color === color);
      if (!variant) {
        variant = { size, color, stock: 0 };
        product.variants.push(variant);
      }
      
      variant.stock = Math.max(0, (variant.stock || 0) + delta);
      // Recalculate total stock from variants
      product.stock = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    } else if (product.hasVariants && product.variants && product.variants.length > 0) {
      // If no size/color specified, adjust the first variant (backward compatibility)
      product.variants[0].stock = Math.max(0, (product.variants[0].stock || 0) + delta);
      // Recalculate total stock from variants
      product.stock = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    } else {
      // No variants, adjust total stock
      const after = Math.max(0, before + delta);
      product.stock = after;
    }
    
    if (product.quantity != null) product.quantity = product.stock;
    syncAvailability(product);
    await product.save();

    await writeStockLog({
      product,
      type: delta > 0 ? "import" : "export",
      quantityChange: delta,
      stockBefore: before,
      stockAfter: product.stock,
      note: note || `${size ? size : ''} ${color ? color : ''}`.trim(),
      req,
    });

    res.json({
      success: true,
      message: `Tồn kho cập nhật: ${before} → ${product.stock}`,
      product: formatProductRow(product.toObject()),
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/** PUT /api/product/inventory/:id/audit — kiểm kê, đặt tồn thực tế */
export const auditStock = async (req, res) => {
  try {
    const { actualStock, note, lowStockThreshold } = req.body;
    const actual = parseInt(actualStock, 10);

    if (Number.isNaN(actual) || actual < 0) {
      return res.json({
        success: false,
        message: "Tồn thực tế phải là số >= 0",
      });
    }

    const product = await productModel.findById(req.params.id);
    if (!product) {
      return res.json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    const before = getEffectiveStock(product);
    const delta = actual - before;
    
    // If product has variants, adjust variants proportionally to match the new total
    if (product.hasVariants && product.variants && product.variants.length > 0) {
      const totalBefore = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
      if (totalBefore > 0) {
        // Distribute the new total proportionally across variants
        const ratio = actual / totalBefore;
        product.variants.forEach(v => {
          v.stock = Math.max(0, Math.round((v.stock || 0) * ratio));
        });
      } else {
        // If all variants were 0, distribute evenly
        const perVariant = Math.floor(actual / product.variants.length);
        product.variants.forEach(v => {
          v.stock = perVariant;
        });
      }
      // Recalculate total stock from variants
      product.stock = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    } else {
      product.stock = actual;
    }
    
    if (product.quantity != null) product.quantity = product.stock;

    if (lowStockThreshold != null) {
      product.lowStockThreshold = Math.max(0, parseInt(lowStockThreshold, 10));
    }

    syncAvailability(product);
    await product.save();

    await writeStockLog({
      product,
      type: "audit",
      quantityChange: delta,
      stockBefore: before,
      stockAfter: product.stock,
      note: note || "Kiểm kê kho",
      req,
    });

    res.json({
      success: true,
      message: `Kiểm kê xong — tồn: ${product.stock}`,
      product: formatProductRow(product.toObject()),
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/** PATCH /api/product/inventory/:id/threshold */
export const updateStockThreshold = async (req, res) => {
  try {
    const threshold = parseInt(req.body.lowStockThreshold, 10);
    if (Number.isNaN(threshold) || threshold < 0) {
      return res.json({
        success: false,
        message: "Ngưỡng cảnh báo phải >= 0",
      });
    }

    const product = await productModel.findByIdAndUpdate(
      req.params.id,
      { lowStockThreshold: threshold },
      { new: true }
    );

    if (!product) {
      return res.json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    res.json({
      success: true,
      message: "Đã cập nhật ngưỡng cảnh báo",
      product: formatProductRow(product.toObject()),
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
