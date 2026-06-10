import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import reviewModel from "../models/reviewModel.js";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import mongoose from "mongoose";
import { STORE_CONTACT_INFO } from "./contactInfo.mjs";

const PRODUCT_SELECT =
  "name price discountedPercentage offer images category brand stock soldQuantity description variants hasVariants";
const IN_STOCK = {}; // Remove stock filter to show all products including out of stock ones
const LIMIT = 5;

const formatVnd = (n) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

export const normalize = (text = "") =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export const toProductCards = (products) =>
  (products || []).map((p) => ({
    id: String(p._id),
    name: p.name,
    price: p.price,
    image: p.images?.[0] || "",
    category: p.category,
    avgRating: p.avgRating,
    reviewCount: p.reviewCount,
    soldQuantity: p.soldQuantity || 0,
  }));

export const buildProductLines = (products, extra = (p) => "") => {
  if (!products?.length) return [];
  return products.map((p, i) => {
    const price = formatVnd(p.price);
    const sale = p.offer ? " 🏷️ Giảm giá" : "";

    // Với chatbot: ưu tiên displayRating (floor(avgRating)) để hiển thị đúng theo truy vấn.
    const displayRating =
      p.displayRating != null
        ? p.displayRating
        : p.roundedRating != null
          ? p.roundedRating
          : p.avgRating;

    const rating =
      displayRating > 0
        ? ` · ⭐ ${displayRating} (${p.reviewCount || 0} đánh giá)`
        : "";

    return `${i + 1}. **${p.name}** — ${price} (${p.category || "—"}${rating})${sale}${extra(p)}`;
  });
};


/** Danh mục đang hoạt động từ MongoDB */
export const fetchCategories = async () => {
  const fromDb = await categoryModel
    .find({ isActive: { $ne: false } })
    .select("name description")
    .sort({ name: 1 })
    .lean();

  if (fromDb.length) return fromDb;

  const distinct = await productModel.distinct("category", IN_STOCK);
  return distinct.filter(Boolean).map((name) => ({ name, description: "" }));
};

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const resolveCategoryFromMessage = async (message) => {
  const n = normalize(message);
  const categories = await fetchCategories();
  const normalizedText = ` ${n} `;

  // Ưu tiên aliases trước để match chính xác hơn
  const aliases = [
    { keys: ["the thao", "thể thao", "do the thao", "đồ thể thao"], category: "Đồ thể thao" },
    { keys: ["mua dong", "mùa đông", "dong", "đồ mùa đông"], category: "Đồ mùa đông" },
    { keys: ["giay", "giày", "sneaker"], category: "Giày" },
    { keys: ["ao", "áo", "shirt"], category: "Áo" },
    { keys: ["quan", "quần", "jean"], category: "Quần" },
    { keys: ["phu kien", "phụ kiện", "tui", "túi", "mu", "mũ"], category: "Phụ kiện" },
  ];

  const sortedAliases = [...aliases].sort(
    (a, b) =>
      Math.max(...b.keys.map((k) => normalize(k).length)) -
      Math.max(...a.keys.map((k) => normalize(k).length))
  );

  for (const { keys, category } of sortedAliases) {
    if (
      keys.some((k) => {
        const key = normalize(k);
        if (key.length < 2) return false;
        const regex = new RegExp(`(?:^|\\s)${escapeRegex(key)}(?:$|\\s)`);
        return regex.test(normalizedText);
      })
    ) {
      const exists = categories.some((c) => normalize(c.name) === normalize(category));
      if (exists || categories.length === 0) return category;
    }
  }

  // Fallback: check exact category names
  for (const cat of categories) {
    const key = normalize(cat.name);
    if (key.length >= 2) {
      const regex = new RegExp(`(?:^|\\s)${escapeRegex(key)}(?:$|\\s)`);
      if (regex.test(normalizedText)) return cat.name;
    }
  }

  return null;
};

/** Tìm SP theo thể loại (category) */
export const searchProductsByCategory = async (message) => {
  const category = await resolveCategoryFromMessage(message);
  console.log("Resolved category:", { message, category });
  if (!category) return { category: null, products: [] };

  // Sửa regex để match category chứa từ khóa (không cần exact match)
  const products = await productModel
    .find({ ...IN_STOCK, category: new RegExp(category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") })
    .select(PRODUCT_SELECT)
    .sort({ soldQuantity: -1 })
    .limit(LIMIT)
    .lean();

  console.log("Category products:", { category, count: products.length });
  return { category, products };
};

/** Parse giá VND từ câu hỏi tiếng Việt */
export const parsePriceRange = (message) => {
  const raw = message.toLowerCase();
  const n = normalize(message);

  const toAmount = (num, unit = "") => {
    const v = parseFloat(String(num).replace(",", "."));
    if (!v || Number.isNaN(v)) return 0;
    const u = normalize(unit);
    if (/tr|trieu/.test(u)) return Math.round(v * 1_000_000);
    if (/k|nghin|ngin/.test(u) || (v < 1000 && /k\b/.test(raw))) return Math.round(v * 1000);
    if (v < 1000 && !unit) return Math.round(v * 1000);
    return Math.round(v);
  };

  const amounts = [];
  const re =
    /(\d+(?:[.,]\d+)?)\s*(trieu|triệu|tr|nghin|nghìn|ngin|k)?/gi;
  let m;
  while ((m = re.exec(raw)) !== null) {
    const amt = toAmount(m[1], m[2] || "");
    if (amt >= 10000) amounts.push(amt);
  }

  const sortCheap = /re nhat|giá rẻ|gia re|tien re|binh dan/.test(n);
  const sortExpensive = /dat nhat|đắt|cao cap|cao cấp|premium/.test(n);

  if (/tu\s+.+\s+den|từ\s+.+\s+đến|khoang|khoảng/.test(n) && amounts.length >= 2) {
    return { min: Math.min(amounts[0], amounts[1]), max: Math.max(amounts[0], amounts[1]), sortCheap, sortExpensive };
  }
  if (/duoi|dưới|nho hon|nhỏ hơn|toi da|tối đa/.test(n) && amounts[0]) {
    return { max: amounts[0], sortCheap: true };
  }
  if (/tren|trên|lon hon|lớn hơn|tu\s+\d|từ\s+\d|it nhat|ít nhất/.test(n) && amounts[0]) {
    return { min: amounts[0], sortExpensive };
  }
  if (amounts[0] && /gia|giá|price|bao nhieu|bao nhiêu/.test(n)) {
    return { min: Math.round(amounts[0] * 0.85), max: Math.round(amounts[0] * 1.15) };
  }
  if (sortCheap) return { sortCheap: true };
  if (sortExpensive) return { sortExpensive: true };

  return null;
};

/** Tìm SP theo khoảng giá */
export const searchProductsByPrice = async (message) => {
  const range = parsePriceRange(message);
  if (!range) return { range: null, products: [] };

  const filter = { ...IN_STOCK };
  if (range.min != null) filter.price = { ...filter.price, $gte: range.min };
  if (range.max != null) filter.price = { ...filter.price, $lte: range.max };

  let sort = { soldQuantity: -1 };
  if (range.sortCheap) sort = { price: 1 };
  if (range.sortExpensive) sort = { price: -1 };

  const products = await productModel
    .find(filter)
    .select(PRODUCT_SELECT)
    .sort(sort)
    .limit(LIMIT)
    .lean();

  return { range, products };
};

const parseRatingQuery = (message) => {
  const n = normalize(message);

  const extractNumber = (s) => {
    const m = String(s).match(/[1-5]/);
    return m ? Number(m[0]) : null;
  };

  // Range: "1 đến 3 sao", "1-3 sao", "từ 2 đến 4 sao", "2..4 sao"
  // Cho phép nhiều biến thể dấu câu + khoảng trắng.
  const rangeMatch = n.match(
    /(?:^|\D)([1-5])\s*(?:đến|den)\s*([1-5])\s*sao(?:\D|$)/
  );

  const rangeMatch2 = n.match(
    /(?:^|\D)([1-5])\s*(?:từ\s*)?([1-5])\s*sao(?:\D|$)/
  );

  const rangeMatch3 = n.match(
    /(?:^|\D)([1-5])\s*(?:-|\.{2}|\.|–|—|to|den)\s*([1-5])\s*sao(?:\D|$)/
  );

  // Range kiểu: "3-4" / "3 . 4" / "3 4" (có thể không có chữ sao sau mỗi số)
  // Cải thiện để match được "sản phẩm 1-2", "1-3", v.v.
  const rangeMatch4 = n.match(
    /(?:^|\D)([1-5])\s*(?:-|\.{2}|\.|–|—)\s*([1-5])(?:\s*sao)?(?:\D|$)/
  );

  const range = rangeMatch || rangeMatch2 || rangeMatch3 || rangeMatch4;

  if (range) {
    const a = extractNumber(range[1]);
    const b = extractNumber(range[2]);
    if (a != null && b != null) {
      const minRating = Math.min(a, b);
      const maxRating = Math.max(a, b);
      return { minRating, maxRating, exactRating: null };
    }
  }

  // Exact match: "1 sao", "2 sao", "3 sao", "4 sao", "5 sao"
  // Cải thiện regex để match được nhiều biến thể
  const exactMatch = n.match(/\b([1-5])\s*sao\b/);

  // Min/range upwards: "trên 4 sao", "từ 3 sao", "trở lên", ...
  // Chỉ coi là "minRange" khi câu có từ khóa "trở lên / lớn hơn / >=".
  // Tránh trường hợp regex đang match nhầm "từ 3 sao" vào ngữ nghĩa min/upwards.
  const isMinRange =
    /(?:^|\s)(?:trở lên|tro len|lớn hơn|lon hon|>=|>|more than|from)\s*[1-5]\s*sao/.test(n) ||
    /[1-5]\s*sao\s*(?:trở lên|tro len|trên|tren|tối thiểu|toi thieu|lớn hơn|lon hon)/.test(n);

  if (exactMatch) {
    const value = Number(exactMatch[1]);
    if (isMinRange) return { minRating: value, maxRating: null, exactRating: null };
    return { minRating: null, maxRating: null, exactRating: value };
  }

  if (/danh gia cao|đánh giá cao|tot nhat|tốt nhất|nhieu sao/.test(n))
    return { minRating: 4, maxRating: null, exactRating: null };
  if (/5 sao|nam sao/.test(n))
    return { minRating: null, maxRating: null, exactRating: 5 };
  if (/4 sao|bon sao/.test(n))
    return { minRating: null, maxRating: null, exactRating: 4 };
  if (/3 sao|ba sao/.test(n))
    return { minRating: null, maxRating: null, exactRating: 3 };
  if (/2 sao|hai sao/.test(n))
    return { minRating: null, maxRating: null, exactRating: 2 };
  if (/1 sao|mot sao/.test(n))
    return { minRating: null, maxRating: null, exactRating: 1 };

  return { minRating: 4, maxRating: null, exactRating: null };
};

/** SP có đánh giá cao — aggregate collection reviews */
export const searchProductsByRating = async (message) => {
  const { minRating, maxRating, exactRating } = parseRatingQuery(message);

  const rated = await reviewModel.aggregate([
    { $match: { isApproved: true } },
    {
      $group: {
        _id: "$productId",
        avgRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
    {
      $addFields: {
        roundedRating: { $floor: "$avgRating" },
      },
    },
    ...(exactRating != null
      ? [
          {
            $match: { roundedRating: exactRating, reviewCount: { $gte: 1 } },
          },
        ]
      : maxRating != null
        ? [
            {
              $match: {
                roundedRating: { $gte: minRating, $lte: maxRating },
                reviewCount: { $gte: 1 },
              },
            },
          ]
        : [
            {
              $match: { avgRating: { $gte: minRating }, reviewCount: { $gte: 1 } },
            },
          ]),
    { $sort: { avgRating: -1, reviewCount: -1 } },
    { $limit: LIMIT },
  ]);

  if (!rated.length) {
    const reviewTotal = await reviewModel.countDocuments({ isApproved: true });
    return {
      minRating: exactRating != null ? exactRating : minRating,
      maxRating,
      exactRating,
      products: [],
      hasReviews: reviewTotal > 0,
    };
  }

  const ids = rated.map((r) => r._id);
  const productMap = new Map();
  const productsRaw = await productModel
    .find({ _id: { $in: ids }, ...IN_STOCK })
    .select(PRODUCT_SELECT)
    .lean();

  for (const p of productsRaw) productMap.set(String(p._id), p);

  const products = rated
    .map((r) => {
      const p = productMap.get(String(r._id));
      if (!p) return null;
      return {
        ...p,
        avgRating: Math.round(r.avgRating * 10) / 10,
        reviewCount: r.reviewCount,
        roundedRating: r.roundedRating,
      };
    })
    .filter(Boolean);

  const reviewTotal = await reviewModel.countDocuments({ isApproved: true });

  return {
    minRating: exactRating != null ? exactRating : minRating,
    maxRating,
    exactRating,
    products,
    hasReviews: reviewTotal > 0,
  };
};

/** Thống kê cửa hàng từ MongoDB */
export const fetchStoreInfo = async () => {
  const [productCount, inStockCount, categories, reviewStats, bestSellers, newArrivals] = await Promise.all([
    productModel.countDocuments({}),
    productModel.countDocuments(IN_STOCK),
    fetchCategories(),
    reviewModel.aggregate([
      { $match: { isApproved: true } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          avgRating: { $avg: "$rating" },
        },
      },
    ]),
    fetchBestSellers(),
    fetchNewArrivals(),
  ]);

  const stats = reviewStats[0] || { totalReviews: 0, avgRating: 0 };
  const categoryNames = categories.map((c) => c.name).join(", ");
  const bestSellerNames = bestSellers.map((p) => p.name).join(", ");
  const newArrivalNames = newArrivals.map((p) => p.name).join(", ");

  return {
    productCount,
    inStockCount,
    categoryCount: categories.length,
    categoryNames,
    totalReviews: stats.totalReviews,
    avgRating: stats.avgRating
      ? Math.round(stats.avgRating * 10) / 10
      : 0,
    bestSellerNames,
    bestSellerCount: bestSellers.length,
    newArrivalNames,
    newArrivalCount: newArrivals.length,
    contact: STORE_CONTACT_INFO,
  };
};

export const formatStoreInfoReply = (info) => {
  const ratingLine =
    info.totalReviews > 0
      ? `\n• **Đánh giá:** ${info.avgRating}⭐ trung bình (${info.totalReviews} lượt)`
      : "\n• **Đánh giá:** Chưa có đánh giá trên hệ thống";

  return (
    `**OREBI** — cửa hàng thời trang tại ${info.contact.city}\n\n` +
    `**Thông tin từ cơ sở dữ liệu:**\n` +
    `• **Sản phẩm:** ${info.inStockCount} đang còn hàng / ${info.productCount} tổng\n` +
    `• **Danh mục (${info.categoryCount}):** ${info.categoryNames || "—"}` +
    ratingLine +
    `\n\n**Liên hệ:** ${info.contact.displayPhone} · ${info.contact.email}\n` +
    `**Địa chỉ:** ${info.contact.address}\n` +
    `Xem thêm: **/shop**, **/contact**, **/faq**`
  );
};

export const formatCategoryListReply = async () => {
  const categories = await fetchCategories();
  if (!categories.length) {
    return "Hiện chưa có danh mục trong hệ thống.";
  }
  const lines = categories.map(
    (c, i) => `${i + 1}. **${c.name}**${c.description ? ` — ${c.description}` : ""}`
  );
  return `**Danh mục đang bán:**\n\n${lines.join("\n")}\n\nBạn có thể hỏi: *"Sản phẩm thể loại Áo"* hoặc *"Giày dưới 1 triệu"*.`;
};

/** Tìm SP theo brand */
export const searchProductsByBrand = async (message) => {
  const n = normalize(message);
  const brands = await productModel.distinct("brand", IN_STOCK);
  
  let matchedBrand = null;
  for (const brand of brands) {
    if (brand && n.includes(normalize(brand))) {
      matchedBrand = brand;
      break;
    }
  }
  
  if (!matchedBrand) return { brand: null, products: [] };
  
  const products = await productModel
    .find({ ...IN_STOCK, brand: new RegExp(`^${matchedBrand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") })
    .select(PRODUCT_SELECT)
    .sort({ soldQuantity: -1 })
    .limit(LIMIT)
    .lean();
  
  return { brand: matchedBrand, products };
};

/** Tìm SP theo tags */
export const searchProductsByTags = async (message) => {
  const n = normalize(message);
  const allTags = await productModel.distinct("tags", IN_STOCK);
  const flatTags = allTags.flat().filter(Boolean);
  
  const matchedTags = flatTags.filter(tag => tag && n.includes(normalize(tag)));
  
  if (!matchedTags.length) return { tags: [], products: [] };
  
  const products = await productModel
    .find({ ...IN_STOCK, tags: { $in: matchedTags } })
    .select(PRODUCT_SELECT)
    .sort({ soldQuantity: -1 })
    .limit(LIMIT)
    .lean();
  
  return { tags: matchedTags, products };
};

/** Best sellers - sản phẩm bán chạy nhất */
export const fetchBestSellers = async () => {
  // Khớp đúng logic CRUD list theo "best_sellers": chỉ sort theo soldQuantity desc
  // (CRUD không thêm sort phụ createdAt).
  const products = await productModel
    .find({ ...IN_STOCK, _type: "best_sellers" })
    .select(PRODUCT_SELECT)
    .sort({ soldQuantity: -1 })
    .limit(LIMIT)
    .lean();

  return products;
};

/** New arrivals - sản phẩm mới nhất */
export const fetchNewArrivals = async () => {
  const products = await productModel
    .find({ ...IN_STOCK, _type: "new_arrivals" })
    .select(PRODUCT_SELECT)
    .sort({ createdAt: -1 })
    .limit(LIMIT)
    .lean();
  
  return products;
};

/** Tất cả brands có sẵn */
export const fetchBrands = async () => {
  const brands = await productModel.distinct("brand", IN_STOCK);
  return brands.filter(Boolean).sort();
};

/** Thống kê đơn hàng của user (nếu có userId) */
export const fetchUserOrderStats = async (userId) => {
  if (!userId) return null;
  
  const stats = await orderModel.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: "$amount" },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
        },
        deliveredOrders: {
          $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || null;
};

/** Lấy thông tin giỏ hàng của user từ Redux hoặc database */
export const fetchUserCartInfo = async (userId) => {
  if (!userId) return null;

  try {
    const user = await userModel.findById(userId).select("userCart").lean();
    if (!user) return null;

    const cartMap = user.userCart || {};
    console.log("User cart from MongoDB (raw):", { userId, cartMap });

    // userCart là object với key là productId_size và value là quantity
    // Cần hydrate để lấy đầy đủ thông tin sản phẩm
    const { hydrateCartItems } = await import("./userCart.mjs");
    const items = await hydrateCartItems(cartMap);

    const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalAmount = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

    console.log("User cart after hydrate:", { userId, items, totalItems, totalAmount });

    return {
      itemCount: totalItems,
      totalAmount,
      items: items.slice(0, 5), // Chỉ trả về 5 sản phẩm đầu tiên
    };
  } catch (error) {
    console.error("Error fetching user cart:", error);
    return null;
  }
};

/** Lấy thông tin cá nhân của user */
export const fetchUserProfile = async (userId) => {
  if (!userId) return null;

  try {
    const user = await userModel.findById(userId).select("name email phone addresses avatar role").lean();
    if (!user) return null;

    // Lấy thêm thông tin đơn hàng
    const orderStats = await fetchUserOrderStats(userId);

    const addresses = user.addresses || [];
    const derivedPhone =
      user.phone ||
      addresses.find((a) => a && a.phone)?.phone ||
      addresses[0]?.phone ||
      "Chưa cập nhật";

    return {
      name: user.name,
      email: user.email,
      phone: derivedPhone,
      addresses,
      avatar: user.avatar || "",
      role: user.role === "admin" ? "Quản trị viên" : "Khách hàng",
      addressCount: addresses?.length || 0,
      orderStats: orderStats
        ? {
            totalOrders: orderStats.totalOrders || 0,
            totalSpent: orderStats.totalSpent || 0,
            pendingOrders: orderStats.pendingOrders || 0,
            deliveredOrders: orderStats.deliveredOrders || 0,
          }
        : null,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

/** Lấy danh sách đơn hàng của user */
export const fetchUserOrders = async (userId, limit = 5) => {
  if (!userId) return null;

  try {
    const orderModel = (await import("../models/orderModel.js")).default;
    const orders = await orderModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    return orders;
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return null;
  }
};
