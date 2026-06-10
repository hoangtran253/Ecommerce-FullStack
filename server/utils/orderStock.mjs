import productModel from "../models/productModel.js";
import stockLogModel from "../models/stockLogModel.js";

const getEffectiveStock = (product) => {
  const stock = product?.stock ?? product?.quantity;
  return Math.max(0, Number(stock) || 0);
};

const syncAvailability = (product) => {
  const stock = getEffectiveStock(product);
  if (stock <= 0) {
    product.isAvailable = false;
  } else {
    product.isAvailable = true;
  }
};

const writeSaleLog = async ({
  product,
  quantityChange,
  stockBefore,
  stockAfter,
  orderId,
  note,
  req,
}) => {
  await stockLogModel.create({
    productId: product._id,
    productName: product.name,
    type: "export",
    quantityChange,
    stockBefore,
    stockAfter,
    note: note || `Đơn hàng #${String(orderId).slice(-8).toUpperCase()}`,
    orderId: orderId || null,
    createdBy: req?.user?.id,
    createdByName: req?.user?.name || req?.user?.email || "Hệ thống",
  });
};

/** Kiểm tra đủ tồn trước khi tạo đơn */
export const validateOrderStock = async (items = []) => {
  const errors = [];

  for (const item of items) {
    const productId = item._id || item.productId;
    if (!productId) {
      errors.push("Thiếu mã sản phẩm trong giỏ hàng");
      continue;
    }

    const product = await productModel.findById(productId);
    if (!product) {
      errors.push(`Không tìm thấy: ${item.name || productId}`);
      continue;
    }

    const qty = Number(item.quantity) || 1;

    // Check variant stock if selectedSize and selectedColor are provided
    if (item.selectedSize && item.selectedColor && product.hasVariants && product.variants) {
      const variant = product.variants.find(
        (v) => v.size === item.selectedSize && v.color === item.selectedColor
      );
      if (!variant) {
        errors.push(
          `${product.name}: không tìm thấy variant ${item.selectedSize} - ${item.selectedColor}`
        );
        continue;
      }
      if (variant.stock < qty) {
        errors.push(
          `${product.name} (${item.selectedSize} - ${item.selectedColor}): còn ${variant.stock}, cần ${qty}`
        );
        continue;
      }
    } else {
      // Check main product stock if no variant selection
      const available = getEffectiveStock(product);
      if (available < qty) {
        errors.push(
          `${product.name}: còn ${available}, cần ${qty}`
        );
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }
};

/** Trừ tồn kho (mỗi đơn chỉ trừ một lần — stockDeducted) */
export const deductOrderStock = async (order, req, note = "Xuất kho") => {
  const errors = [];

  // Cộng soldQuantity khi đơn hàng được tạo (đặt hàng thành công)
  const shouldCountSold = true;

  for (const item of order.items || []) {
    const productId = item.productId?._id || item.productId;
    if (!productId) continue;

    const product = await productModel.findById(productId);
    if (!product) {
      errors.push(`Không tìm thấy SP: ${item.name}`);
      continue;
    }

    const qty = Number(item.quantity) || 1;

    // Deduct from variant stock if selectedSize and selectedColor are provided
    if (item.selectedSize && item.selectedColor && product.hasVariants && product.variants) {
      const variantIndex = product.variants.findIndex(
        (v) => v.size === item.selectedSize && v.color === item.selectedColor
      );

      if (variantIndex === -1) {
        errors.push(
          `${item.name}: không tìm thấy variant ${item.selectedSize} - ${item.selectedColor}`
        );
        continue;
      }

      const variant = product.variants[variantIndex];
      const before = variant.stock;

      if (before < qty) {
        errors.push(
          `${item.name} (${item.selectedSize} - ${item.selectedColor}): không đủ tồn (còn ${before}, cần ${qty})`
        );
        continue;
      }

      const after = before - qty;
      product.variants[variantIndex].stock = after;

      // Also deduct from main product stock to keep total consistent
      const mainBefore = getEffectiveStock(product);
      const mainAfter = mainBefore - qty;
      product.stock = mainAfter;
      if (product.quantity != null) product.quantity = mainAfter;

      // Chỉ cộng soldQuantity khi điều kiện đúng
      if (shouldCountSold) {
        const soldBefore = product.soldQuantity || 0;
        const soldAfter = soldBefore + qty;
        product.soldQuantity = soldAfter;
      }

      syncAvailability(product);
      await product.save();

      await writeSaleLog({
        product,
        quantityChange: -qty,
        stockBefore: before,
        stockAfter: after,
        orderId: order._id,
        note: `${note} (${item.selectedSize} - ${item.selectedColor})`,
        req,
      });
    } else {
      // Deduct from main product stock if no variant selection
      const before = getEffectiveStock(product);

      if (before < qty) {
        errors.push(
          `${item.name}: không đủ tồn (còn ${before}, cần ${qty})`
        );
        continue;
      }

      const after = before - qty;
      product.stock = after;
      if (product.quantity != null) product.quantity = after;

      // Chỉ cộng soldQuantity khi điều kiện đúng
      if (shouldCountSold) {
        const soldBefore = product.soldQuantity || 0;
        const soldAfter = soldBefore + qty;
        product.soldQuantity = soldAfter;
      }

      syncAvailability(product);
      await product.save();

      await writeSaleLog({
        product,
        quantityChange: -qty,
        stockBefore: before,
        stockAfter: after,
        orderId: order._id,
        note,
        req,
      });
    }
  }

  if (errors.length > 0) {
    const err = new Error(errors.join("; "));
    err.partial = true;
    throw err;
  }
};

/** Hoàn tồn khi hủy đơn đã trừ kho */
export const restoreOrderStock = async (order, req) => {
  for (const item of order.items || []) {
    const productId = item.productId?._id || item.productId;
    if (!productId) continue;

    const product = await productModel.findById(productId);
    if (!product) continue;

    const qty = Number(item.quantity) || 1;

    // Restore variant stock if selectedSize and selectedColor are provided
    if (item.selectedSize && item.selectedColor && product.hasVariants && product.variants) {
      const variantIndex = product.variants.findIndex(
        (v) => v.size === item.selectedSize && v.color === item.selectedColor
      );

      if (variantIndex !== -1) {
        const variant = product.variants[variantIndex];
        const before = variant.stock;
        const after = before + qty;
        product.variants[variantIndex].stock = after;

        // Also restore main product stock to keep total consistent
        const mainBefore = getEffectiveStock(product);
        const mainAfter = mainBefore + qty;
        product.stock = mainAfter;
        if (product.quantity != null) product.quantity = mainAfter;

        // Luôn trừ soldQuantity khi restore stock
        const soldBefore = product.soldQuantity || 0;
        product.soldQuantity = Math.max(0, soldBefore - qty);

        syncAvailability(product);
        await product.save();

        await stockLogModel.create({
          productId: product._id,
          productName: product.name,
          type: "import",
          quantityChange: qty,
          stockBefore: before,
          stockAfter: after,
          note: `Hoàn kho — đơn hủy/đổi trạng thái (${item.selectedSize} - ${item.selectedColor})`,
          createdBy: req?.user?.id,
          createdByName: req?.user?.name || req?.user?.email || "Hệ thống",
        });
      }
    } else {
      // Restore main product stock if no variant selection
      const before = getEffectiveStock(product);
      const after = before + qty;

      product.stock = after;
      if (product.quantity != null) product.quantity = after;

      // Luôn trừ soldQuantity khi restore stock
      const soldBefore = product.soldQuantity || 0;
      product.soldQuantity = Math.max(0, soldBefore - qty);

      syncAvailability(product);
      await product.save();

      await stockLogModel.create({
        productId: product._id,
        productName: product.name,
        type: "import",
        quantityChange: qty,
        stockBefore: before,
        stockAfter: after,
        note: `Hoàn kho — đơn hủy/đổi trạng thái`,
        createdBy: req?.user?.id,
        createdByName: req?.user?.name || req?.user?.email || "Hệ thống",
      });
    }
  }
};
