import productModel from "../models/productModel.js";
import faqModel from "../models/faqModel.js";
import chatHistoryModel from "../models/chatHistoryModel.js";
import {
  GREETING_REPLY,
  CONTACT_REPLY,
  FORGOT_PASSWORD_REPLY,
  ORDER_TRACK_REPLY,
  FAQ_ENTRIES,
} from "../data/chatKnowledge.mjs";
import {
  normalize,
  searchProductsByCategory,
  searchProductsByPrice,
  searchProductsByRating,
  fetchStoreInfo,
  formatStoreInfoReply,
  formatCategoryListReply,
  buildProductLines,
  toProductCards,
  parsePriceRange,
  searchProductsByBrand,
  searchProductsByTags,
  fetchBestSellers,
  fetchNewArrivals,
  fetchBrands,
  fetchUserCartInfo,
  fetchUserProfile,
  fetchUserOrders,
} from "./chatbotQueries.mjs";

const PRODUCT_SELECT =
  "name price discountedPercentage offer images category brand stock description variants hasVariants";
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const matchFaqKey = (n, key) => {
  const k = normalize(key);
  if (!k || k.length < 2) return false;
  if (k.length <= 3) {
    const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`).test(n);
  }
  return n.includes(k);
};

const loadFaqs = async () => {
  try {
    const dbFaqs = await faqModel.find({ isActive: true }).sort({ priority: -1 });
    if (dbFaqs.length) return dbFaqs;
  } catch (error) {
    console.error("Error fetching FAQs:", error);
  }
  return FAQ_ENTRIES;
};

const matchFaq = async (message) => {
  const n = normalize(message);
  const faqs = await loadFaqs();
  let best = null;

  for (const faq of faqs) {
    for (const key of faq.keys) {
      if (matchFaqKey(n, key)) {
        const keyLen = normalize(key).length;
        if (!best || keyLen > best.keyLen) {
          best = { answer: faq.answer, keyLen };
        }
      }
    }
  }

  return best?.answer || null;
};

const enrichFaqContext = (faqAnswer, n, storeInfo) => {
  if (/(?:^|\\s)(?:kho|ton kho|con hang|het hang)(?:\\s|$)/.test(n) && storeInfo) {
    return `${faqAnswer}\\n\\nHiện shop có **${storeInfo.inStockCount}** sản phẩm còn hàng / ${storeInfo.productCount} tổng.`;
  }
  if (/(?:^|\\s)(?:giao hang|ship|van chuyen|freeship|mien phi van chuyen)(?:\\s|$)/.test(n) && storeInfo?.contact) {
    return `${faqAnswer}\\n\\nHotline hỗ trợ: **${storeInfo.contact.displayPhone}**.`;
  }
  return faqAnswer;
};

const handleFaqReply = async (text, n, storeInfo) => {
  const faq = await matchFaq(text);
  if (!faq) return null;
  const context = enrichFaqContext(faq, n, storeInfo);
  return { reply: context, products: [] };
};

const saveChatHistory = async (userId, userMessage, botReply, products = []) => {
  if (!userId) return;

  try {
    let history = await chatHistoryModel.findOne({ userId });

    if (!history) {
      history = await chatHistoryModel.create({
        userId,
        messages: [],
      });
    }

    history.messages.push({
      role: "user",
      content: userMessage,
      products: [],
      timestamp: new Date(),
    });

    history.messages.push({
      role: "bot",
      content: botReply,
      products: products || [],
      timestamp: new Date(),
    });

    history.lastUpdated = new Date();
    await history.save();
  } catch (error) {
    console.error("Error saving chat history:", error);
  }
};

const extractProductKeywords = (message) => {
  const n = normalize(message);
  const cleaned = n
    .replace(
      /\btu van\b|\btư vấn\b|\bsan pham\b|\bsản phẩm\b|\btim\b|\btìm\b|\bmua\b|\bdanh muc\b|\bdanh mục\b|\bgia\b|\bgiá\b|\bdanh gia\b|\bđánh giá\b|\bsao\b|\bco\b|\bcó\b|\bcho\b|\btôi\b|\btoi\b|\bminh\b|\bmình\b|\borebi\b|\bduoi\b|\bdưới\b|\btren\b|\btrên\b|\bcua\b|\bcủa\b|\bnhững\b|\bcác\b|\bvề\b|\btrong\b|\bcho tôi\b|\btôi muốn\b|\btôi cần\b/gi,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length >= 2 ? cleaned : "";
};

const searchProductsByKeyword = async (message, limit = 5) => {
  const rawWords = message
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter((w) => w.length >= 2);
  const words = [...new Set(rawWords)].filter((w) => w.length >= 2);
  // Remove stock filter to show all products including out of stock ones
  const filter = {};

  if (!words.length) return [];

  // Extract brand if mentioned (nike, adidas, uniqlo, etc.)
  const brands = ["nike", "adidas", "puma", "converse", "vans", "uniqlo", "zara", "hm", "gucci", "lv"];
  const mentionedBrand = words.find(w => brands.includes(w.toLowerCase()));
  const otherWords = mentionedBrand ? words.filter(w => w.toLowerCase() !== mentionedBrand.toLowerCase()) : words;

  // First try: exact phrase match in name + brand (most precise)
  if (mentionedBrand && otherWords.length > 0) {
    const phraseRegex = new RegExp(otherWords.join(" "), "i");
    const brandRegex = new RegExp(mentionedBrand, "i");
    const brandMatches = await productModel
      .find({ ...filter, name: phraseRegex, brand: brandRegex })
      .select(PRODUCT_SELECT)
      .limit(limit)
      .lean();

    if (brandMatches.length > 0) {
      return brandMatches;
    }
  }

  // Second try: exact phrase match in name (most precise)
  const phraseRegex = new RegExp(words.join(" "), "i");
  const exactMatches = await productModel
    .find({ ...filter, name: phraseRegex })
    .select(PRODUCT_SELECT)
    .limit(limit)
    .lean();

  if (exactMatches.length > 0) {
    return exactMatches;
  }

  // Third try: all words must appear in name (AND condition) with word boundaries
  const nameAndClauses = words.map((w) => {
    const regex = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    return { name: regex };
  });

  const andMatches = await productModel
    .find({ ...filter, $and: nameAndClauses })
    .select(PRODUCT_SELECT)
    .limit(limit)
    .lean();

  if (andMatches.length > 0) {
    return andMatches;
  }

  // Fallback to $or search only in name field (not description/category/brand)
  const orClauses = words.map((w) => {
    const regex = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    return { name: regex };
  });

  return productModel
    .find({ ...filter, $or: orClauses })
    .select(PRODUCT_SELECT)
    .limit(limit)
    .lean();
};

// Tìm sản phẩm chỉ theo tên (khi user hỏi "sản phẩm [từ khóa]")
const searchProductsByName = async (message, limit = 5) => {
  const keyword = extractProductKeywords(message);
  const rawWords = message
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter((w) => w.length >= 2);
  const words = [...new Set([...keyword.split(" "), ...rawWords])].filter((w) => w.length >= 2);
  // Remove stock filter to show all products including out of stock ones
  const filter = {};

  if (!words.length) return [];

  // Extract brand if mentioned
  const brands = ["nike", "adidas", "puma", "converse", "vans", "uniqlo", "zara", "hm", "gucci", "lv"];
  const mentionedBrand = words.find(w => brands.includes(w.toLowerCase()));
  const otherWords = mentionedBrand ? words.filter(w => w.toLowerCase() !== mentionedBrand.toLowerCase()) : words;

  // First try: name + brand match
  if (mentionedBrand && otherWords.length > 0) {
    const nameClauses = otherWords.map((w) => {
      const regex = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      return { name: regex };
    });
    const brandRegex = new RegExp(mentionedBrand, "i");

    const brandMatches = await productModel
      .find({ ...filter, $and: [...nameClauses, { brand: brandRegex }] })
      .select(PRODUCT_SELECT)
      .limit(limit)
      .lean();

    if (brandMatches.length > 0) {
      return brandMatches;
    }
  }

  const nameClauses = words.map((w) => {
    const regex = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    return { name: regex };
  });

  return productModel
    .find({ ...filter, $or: nameClauses })
    .select(PRODUCT_SELECT)
    .limit(limit)
    .lean();
};

// Tìm sản phẩm tương tự khi sản phẩm hết hàng
const findSimilarProducts = async (product, limit = 3) => {
  if (!product) return [];

  const filter = { _id: { $ne: product._id } };
  const orConditions = [];

  // Tìm theo cùng category
  if (product.category) {
    orConditions.push({ category: new RegExp(product.category, "i") });
  }

  // Tìm theo cùng brand
  if (product.brand) {
    orConditions.push({ brand: new RegExp(product.brand, "i") });
  }

  // Tìm theo giá tương tự (±20%)
  if (product.price) {
    const minPrice = product.price * 0.8;
    const maxPrice = product.price * 1.2;
    orConditions.push({ price: { $gte: minPrice, $lte: maxPrice } });
  }

  if (orConditions.length > 0) {
    filter.$or = orConditions;
  }

  // Ưu tiên sản phẩm còn hàng
  const similarProducts = await productModel
    .find(filter)
    .select(PRODUCT_SELECT)
    .sort({ stock: -1 })
    .limit(limit)
    .lean();

  return similarProducts;
};

// Tìm sản phẩm theo category + keyword (ví dụ: "áo thể thao")
const searchProductsByCategoryAndKeyword = async (message, limit = 5) => {
  const n = normalize(message);
  const categories = ["phụ kiện", "áo", "quần", "giày"];
  let matchedCategory = null;
  let keyword = "";

  for (const cat of categories) {
    if (n.includes(normalize(cat))) {
      matchedCategory = cat;
      break;
    }
  }

  if (!matchedCategory) return [];

  keyword = n
    .replace(normalize(matchedCategory), "")
    .replace(/san pham|sản phẩm|tim|tìm|mua|cho tôi|tôi muốn/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (keyword.length < 2) return [];

  const filter = { stock: { $gt: 0 }, category: new RegExp(matchedCategory, "i") };
  const nameRegex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  return productModel
    .find({ ...filter, name: nameRegex })
    .select(PRODUCT_SELECT)
    .limit(limit)
    .lean();
};

const buildProductReply = (intro, products) => {
  if (!products?.length) {
    return {
      reply:
        intro +
        "\n\nMình chưa tìm thấy sản phẩm phù hợp. Thử hỏi rõ hơn hoặc vào **/shop**.",
      products: [],
    };
  }
  const lines = buildProductLines(products);
  return {
    reply: `${intro}\n\n${lines.join("\n")}\n\nBấm sản phẩm bên dưới để xem chi tiết.`,
    products: toProductCards(products),
  };
};

const formatPriceRangeLabel = (range) => {
  if (!range) return "";
  const fmt = (n) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(n);
  if (range.min != null && range.max != null) {
    return `từ ${fmt(range.min)} đến ${fmt(range.max)}`;
  }
  if (range.max != null) return `dưới ${fmt(range.max)}`;
  if (range.min != null) return `từ ${fmt(range.min)} trở lên`;
  if (range.sortCheap) return "giá thấp nhất";
  if (range.sortExpensive) return "giá cao nhất";
  return "";
};

const fetchDynamicContext = async (message, userId = null) => {
  const n = normalize(message);
  let context = "";

  // Thêm thông tin cửa hàng khi user hỏi về cửa hàng/địa chỉ/liên hệ
  if (/(cua hang|cửa hàng|dia chi|địa chỉ|lien he|liên hệ|thong tin|thông tin|ban o dau|bán ở đâu|shop|store|address|contact)/.test(n)) {
    try {
      const storeInfo = await fetchStoreInfo();
      if (storeInfo && storeInfo.contact) {
        context += `\n\nTHÔNG TIN CỬA HÀNG OREBI:\n`;
        context += `• Địa chỉ: ${storeInfo.contact.address}\n`;
        context += `• Thành phố: ${storeInfo.contact.city}\n`;
        context += `• Số điện thoại: ${storeInfo.contact.displayPhone}\n`;
        context += `• Email: ${storeInfo.contact.email}\n`;
        context += `• Tổng số sản phẩm: ${storeInfo.productCount}\n`;
        context += `• Sản phẩm còn hàng: ${storeInfo.inStockCount}\n`;
        context += `• Số danh mục: ${storeInfo.categoryCount}\n`;
        if (storeInfo.totalReviews > 0) {
          context += `• Đánh giá trung bình: ${storeInfo.avgRating}⭐ (${storeInfo.totalReviews} lượt)\n`;
        }
      }
    } catch (error) {
      console.error("Error fetching store info for AI context:", error);
    }
  }

  // Thêm thông tin user cá nhân khi user hỏi về thông tin cá nhân/tài khoản
  if (/(tai khoan|tài khoản|thong tin ca nhan|thông tin cá nhân|ho ten|họ tên|email|dia chi|địa chỉ|so dien thoai|số điện thoại|profile|thong tin minh|thông tin mình)/.test(n) && userId) {
    try {
      const userProfile = await fetchUserProfile(userId);
      if (userProfile) {
        context += `\n\nTHÔNG TIN CÁ NHÂN CỦA BẠN:\n`;
        context += `• Tên: ${userProfile.name || "Chưa cập nhật"}\n`;
        context += `• Email: ${userProfile.email || "Chưa cập nhật"}\n`;
        if (userProfile.phone) {
          context += `• Số điện thoại: ${userProfile.phone}\n`;
        }
        if (userProfile.address) {
          context += `• Địa chỉ: ${userProfile.address}\n`;
        }
      }
    } catch (error) {
      console.error("Error fetching user profile for AI context:", error);
    }
  }

  // Thêm thông tin variants khi user hỏi về size, màu, tồn kho
  if (isVariantIntent(n)) {
    try {
      const keywordProducts = await searchProductsByKeyword(message, 3);
      if (keywordProducts && keywordProducts.length > 0) {
        context += "\n\nSản phẩm liên quan:\n";
        for (let i = 0; i < Math.min(keywordProducts.length, 3); i++) {
          const product = keywordProducts[i];
          const formatVnd = (n) =>
            new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
              maximumFractionDigits: 0,
            }).format(Number(n) || 0);

          let variantInfo = "";
          let availableSizes = [];
          let availableColors = [];
          let isOutOfStock = false;
          
          if (product.variants && product.variants.length > 0) {
            const variantsByColor = {};
            product.variants.forEach((v) => {
              if (v.color && v.size) {
                if (!variantsByColor[v.color]) variantsByColor[v.color] = [];
                variantsByColor[v.color].push({ size: v.size, stock: v.stock || 0 });
                if (v.stock > 0) {
                  availableSizes.push(v.size);
                  availableColors.push(v.color);
                }
              }
            });

            // Group by color and show sizes with stock
            const variantLines = Object.entries(variantsByColor)
              .map(([color, variants]) => {
                const sizeStr = variants
                  .map((v) => `Size ${v.size}${v.stock > 0 ? ` (${v.stock})` : " (hết)"}`)
                  .join(", ");
                return `${color}: ${sizeStr}`;
              })
              .join(" | ");

            variantInfo = `\n   Biến thể: ${variantLines}`;
            
            // Add explicit list of available sizes and colors
            const uniqueAvailableSizes = [...new Set(availableSizes)];
            const uniqueAvailableColors = [...new Set(availableColors)];
            
            // Also add all sizes with their stock status for better AI understanding
            const allSizes = [...new Set(product.variants.map(v => v.size))];
            const sizeStatus = allSizes.map(size => {
              const sizeVariants = product.variants.filter(v => v.size === size);
              const totalStock = sizeVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
              return `${size}: ${totalStock > 0 ? `còn ${totalStock} cái` : 'hết hàng'}`;
            }).join(", ");
            
            if (sizeStatus) {
              variantInfo += `\n   Trạng thái size: ${sizeStatus}`;
            }
            
            if (uniqueAvailableSizes.length > 0) {
              variantInfo += `\n   Size còn hàng: ${uniqueAvailableSizes.join(", ")}`;
            }
            if (uniqueAvailableColors.length > 0) {
              variantInfo += `\n   Màu còn hàng: ${uniqueAvailableColors.join(", ")}`;
            }
            
            if (uniqueAvailableSizes.length === 0 && uniqueAvailableColors.length === 0) {
              variantInfo += `\n   ⚠️ TẤT CẢ ĐÃ HẾT HÀNG`;
              isOutOfStock = true;
            }
          } else if (product.stock > 0) {
            variantInfo = `\n   Còn hàng: ${product.stock} cái (không phân size)`;
          } else {
            variantInfo = `\n   ⚠️ HẾT HÀNG`;
            isOutOfStock = true;
          }

          context += `${i + 1}. ${product.name} - ${formatVnd(product.price)} - ${product.rating || 0} sao - ${product.soldQuantity || 0} đã bán${variantInfo}\n`;

          // If product is out of stock, find and add similar products
          if (isOutOfStock) {
            const similarProducts = await findSimilarProducts(product, 2);
            if (similarProducts && similarProducts.length > 0) {
              context += `\n   💡 Sản phẩm tương tự còn hàng:\n`;
              similarProducts.forEach((simProduct, j) => {
                const simFormatVnd = (n) =>
                  new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                    maximumFractionDigits: 0,
                  }).format(Number(n) || 0);
                let simVariantInfo = "";
                if (simProduct.variants && simProduct.variants.length > 0) {
                  const simAvailableColors = [...new Set(simProduct.variants.filter(v => v.stock > 0).map(v => v.color))];
                  const simAvailableSizes = [...new Set(simProduct.variants.filter(v => v.stock > 0).map(v => v.size))];
                  if (simAvailableColors.length > 0) {
                    simVariantInfo += ` (Màu: ${simAvailableColors.join(", ")})`;
                  }
                  if (simAvailableSizes.length > 0) {
                    simVariantInfo += ` (Size: ${simAvailableSizes.join(", ")})`;
                  }
                }
                context += `      ${j + 1}. ${simProduct.name} - ${simFormatVnd(simProduct.price)}${simVariantInfo}\n`;
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching products for variant context:", error);
    }
  }

  if (isOrderIntent(n) && userId) {
    try {
      const orders = await fetchUserOrders(userId, 3);
      if (orders && orders.length > 0) {
        context += "\n\nĐơn hàng gần nhất:\n";
        orders.slice(0, 3).forEach((order, i) => {
          const statusMap = {
            Pending: "Đang chờ",
            Processing: "Đang xử lý",
            Shipped: "Đã giao",
            Delivered: "Đã nhận",
            Cancelled: "Đã hủy",
          };
          const status = statusMap[order.status] || order.status;
          const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : "N/A";
          const totalQuantity = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
          context += `${i + 1}. Đơn #${order._id.toString().slice(-6).toUpperCase()} (${date}) - ${status} - ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(order.amount)} - ${totalQuantity} sản phẩm\n`;
        });
      }
    } catch (error) {
      console.error("Error fetching orders for AI context:", error);
    }
  }

  if (isCartIntent(n) && userId) {
    try {
      const cartInfo = await fetchUserCartInfo(userId);
      if (cartInfo && cartInfo.itemCount > 0) {
        context += `\n\nGiỏ hàng hiện tại: ${cartInfo.itemCount} sản phẩm - ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(cartInfo.totalAmount)}`;
        if (cartInfo.items && cartInfo.items.length > 0) {
          context += "\nSản phẩm trong giỏ:\n";
          cartInfo.items.forEach((item, i) => {
            context += `${i + 1}. ${item.name} - ${item.quantity} cái - ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(item.price)}\n`;
          });
        }
      }
    } catch (error) {
      console.error("Error fetching cart for AI context:", error);
    }
  }

  const wantsDryQuick = /khô nhanh|kho nhanh|dry quick|the thao kho nhanh|thể thao khô nhanh|áo thun thể thao khô nhanh/.test(n);

  // Nếu user hỏi size/chiều cao và có nhắc "khô nhanh" → ưu tiên lấy đúng sản phẩm liên quan để Kiwi không bịa/khuyên sai size
  if (
    wantsDryQuick &&
    /(cao|thap|chieu cao|1m\d+|1m5|1m6|1m7|1m8|1m9)/.test(n)
  ) {
    try {
      const keywordProducts = await searchProductsByKeyword(`${message} khô nhanh`, 3);
      if (keywordProducts && keywordProducts.length > 0) {
        context += "\n\nSản phẩm liên quan (ưu tiên khô nhanh):\n";
        keywordProducts.slice(0, 3).forEach((product, i) => {
          const formatVnd = (n) =>
            new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
              maximumFractionDigits: 0,
            }).format(Number(n) || 0);

          let variantInfo = "";
          let availableSizes = [];
          if (product.variants && product.variants.length > 0) {
            const variantsByColor = {};
            product.variants.forEach((v) => {
              if (v.color && v.size) {
                if (!variantsByColor[v.color]) variantsByColor[v.color] = [];
                variantsByColor[v.color].push({ size: v.size, stock: v.stock || 0 });
                if (v.stock > 0) {
                  availableSizes.push(v.size);
                }
              }
            });

            const variantLines = Object.entries(variantsByColor)
              .map(([color, variants]) => {
                const sizeStr = variants
                  .map((v) => `Size ${v.size}${v.stock > 0 ? ` (${v.stock})` : " (hết)"}`)
                  .join(", ");
                return `${color}: ${sizeStr}`;
              })
              .join(" | ");

            variantInfo = `\n   Biến thể: ${variantLines}`;
            
            // Add explicit list of available sizes
            const uniqueAvailableSizes = [...new Set(availableSizes)];
            if (uniqueAvailableSizes.length > 0) {
              variantInfo += `\n   Size còn hàng: ${uniqueAvailableSizes.join(", ")}`;
            } else {
              variantInfo += `\n   ⚠️ TẤT CẢ SIZE ĐÃ HẾT HÀNG`;
            }
          } else if (product.stock > 0) {
            variantInfo = `\n   Còn hàng: ${product.stock} cái (không phân size)`;
          }

          context += `${i + 1}. ${product.name} - ${formatVnd(product.price)} - ${product.rating || 0} sao - ${product.soldQuantity || 0} đã bán${variantInfo}\n`;
        });
      }
    } catch (error) {
      console.error("Error fetching dry quick products for AI context:", error);
    }
  }

  if (
    !isOrderIntent(n) &&
    !isCartIntent(n) &&
    !isCategoryIntent(n) &&
    !isBrandIntent(n) &&
    !isPriceIntent(n) &&
    !isRatingIntent(n)
  ) {

    try {
      const keywordProducts = await searchProductsByKeyword(message, 3);
      if (keywordProducts && keywordProducts.length > 0) {
        context += "\n\nSản phẩm liên quan:\n";
        keywordProducts.slice(0, 3).forEach((product, i) => {
          const formatVnd = (n) =>
            new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
              maximumFractionDigits: 0,
            }).format(Number(n) || 0);

          let variantInfo = "";
          let availableSizes = [];
          let availableColors = [];
          if (product.variants && product.variants.length > 0) {
            // Group variants by color with their sizes and stock
            const variantsByColor = {};
            product.variants.forEach((v) => {
              if (v.color && v.size) {
                if (!variantsByColor[v.color]) variantsByColor[v.color] = [];
                variantsByColor[v.color].push({ size: v.size, stock: v.stock || 0 });
                if (v.stock > 0) {
                  availableSizes.push(v.size);
                  availableColors.push(v.color);
                }
              }
            });

            const variantLines = Object.entries(variantsByColor)
              .map(([color, variants]) => {
                const sizeStr = variants
                  .map((v) => `Size ${v.size}${v.stock > 0 ? ` (${v.stock})` : " (hết)"}`)
                  .join(", ");
                return `${color}: ${sizeStr}`;
              })
              .join(" | ");

            variantInfo = `\n   Biến thể: ${variantLines}`;
            
            // Add explicit list of available sizes and colors
            const uniqueAvailableSizes = [...new Set(availableSizes)];
            const uniqueAvailableColors = [...new Set(availableColors)];
            
            // Also add all sizes with their stock status for better AI understanding
            const allSizes = [...new Set(product.variants.map(v => v.size))];
            const sizeStatus = allSizes.map(size => {
              const sizeVariants = product.variants.filter(v => v.size === size);
              const totalStock = sizeVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
              return `${size}: ${totalStock > 0 ? `còn ${totalStock} cái` : 'hết hàng'}`;
            }).join(", ");
            
            if (sizeStatus) {
              variantInfo += `\n   Trạng thái size: ${sizeStatus}`;
            }
            
            if (uniqueAvailableSizes.length > 0) {
              variantInfo += `\n   Size còn hàng: ${uniqueAvailableSizes.join(", ")}`;
            }
            if (uniqueAvailableColors.length > 0) {
              variantInfo += `\n   Màu còn hàng: ${uniqueAvailableColors.join(", ")}`;
            }
            
            if (uniqueAvailableSizes.length === 0 && uniqueAvailableColors.length === 0) {
              variantInfo += `\n   ⚠️ TẤT CẢ ĐÃ HẾT HÀNG`;
            }
          } else if (product.stock > 0) {
            variantInfo = `\n   Còn hàng: ${product.stock} cái (không phân size)`;
          }

          context += `${i + 1}. ${product.name} - ${formatVnd(product.price)} - ${product.rating || 0} sao - ${product.soldQuantity || 0} đã bán${variantInfo}\n`;
        });
      }
    } catch (error) {
      console.error("Error fetching products for AI context:", error);
    }
  }

  if (isCategoryIntent(n)) {
    try {
      const { category, products } = await searchProductsByCategory(message);
      if (category && products && products.length > 0) {
        context += `\n\nDanh mục ${category} có ${products.length} sản phẩm:\n`;
        products.slice(0, 5).forEach((product, i) => {
          const formatVnd = (n) =>
            new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
              maximumFractionDigits: 0,
            }).format(Number(n) || 0);

          let variantInfo = "";
          let availableSizes = [];
          let availableColors = [];
          if (product.variants && product.variants.length > 0) {
            const variantsByColor = {};
            product.variants.forEach((v) => {
              if (v.color && v.size) {
                if (!variantsByColor[v.color]) variantsByColor[v.color] = [];
                variantsByColor[v.color].push({ size: v.size, stock: v.stock || 0 });
                if (v.stock > 0) {
                  availableSizes.push(v.size);
                  availableColors.push(v.color);
                }
              }
            });

            const variantLines = Object.entries(variantsByColor)
              .map(([color, variants]) => {
                const sizeStr = variants
                  .map((v) => `Size ${v.size}${v.stock > 0 ? ` (${v.stock})` : " (hết)"}`) 
                  .join(", ");
                return `${color}: ${sizeStr}`;
              })
              .join(" | ");

            variantInfo = ` - Biến thể: ${variantLines}`;
            
            // Add explicit list of available sizes and colors
            const uniqueAvailableSizes = [...new Set(availableSizes)];
            const uniqueAvailableColors = [...new Set(availableColors)];
            
            // Also add all sizes with their stock status for better AI understanding
            const allSizes = [...new Set(product.variants.map(v => v.size))];
            const sizeStatus = allSizes.map(size => {
              const sizeVariants = product.variants.filter(v => v.size === size);
              const totalStock = sizeVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
              return `${size}: ${totalStock > 0 ? `còn ${totalStock} cái` : 'hết hàng'}`;
            }).join(", ");
            
            if (sizeStatus) {
              variantInfo += ` (Trạng thái size: ${sizeStatus})`;
            }
            
            if (uniqueAvailableSizes.length > 0) {
              variantInfo += ` (Size còn hàng: ${uniqueAvailableSizes.join(", ")})`;
            }
            if (uniqueAvailableColors.length > 0) {
              variantInfo += ` (Màu còn hàng: ${uniqueAvailableColors.join(", ")})`;
            }
            
            if (uniqueAvailableSizes.length === 0 && uniqueAvailableColors.length === 0) {
              variantInfo += ` (⚠️ TẤT CẢ ĐÃ HẾT HÀNG)`;
            }
          }

          context += `${i + 1}. ${product.name} - ${formatVnd(product.price)}${variantInfo}\n`;
        });
      }
    } catch (error) {
      console.error("Error fetching category for AI context:", error);
    }
  }

  if (isBrandIntent(n)) {
    try {
      const { brand, products } = await searchProductsByBrand(message);
      if (brand && products && products.length > 0) {
        context += `\n\nThương hiệu ${brand} có ${products.length} sản phẩm:\n`;
        products.slice(0, 5).forEach((product, i) => {
          const formatVnd = (n) =>
            new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
              maximumFractionDigits: 0,
            }).format(Number(n) || 0);

          let variantInfo = "";
          let availableSizes = [];
          let availableColors = [];
          if (product.variants && product.variants.length > 0) {
            const variantsByColor = {};
            product.variants.forEach((v) => {
              if (v.color && v.size) {
                if (!variantsByColor[v.color]) variantsByColor[v.color] = [];
                variantsByColor[v.color].push({ size: v.size, stock: v.stock || 0 });
                if (v.stock > 0) {
                  availableSizes.push(v.size);
                  availableColors.push(v.color);
                }
              }
            });

            const variantLines = Object.entries(variantsByColor)
              .map(([color, variants]) => {
                const sizeStr = variants
                  .map((v) => `Size ${v.size}${v.stock > 0 ? ` (${v.stock})` : " (hết)"}`) 
                  .join(", ");
                return `${color}: ${sizeStr}`;
              })
              .join(" | ");

            variantInfo = ` - Biến thể: ${variantLines}`;
            
            // Add explicit list of available sizes and colors
            const uniqueAvailableSizes = [...new Set(availableSizes)];
            const uniqueAvailableColors = [...new Set(availableColors)];
            
            // Also add all sizes with their stock status for better AI understanding
            const allSizes = [...new Set(product.variants.map(v => v.size))];
            const sizeStatus = allSizes.map(size => {
              const sizeVariants = product.variants.filter(v => v.size === size);
              const totalStock = sizeVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
              return `${size}: ${totalStock > 0 ? `còn ${totalStock} cái` : 'hết hàng'}`;
            }).join(", ");
            
            if (sizeStatus) {
              variantInfo += ` (Trạng thái size: ${sizeStatus})`;
            }
            
            if (uniqueAvailableSizes.length > 0) {
              variantInfo += ` (Size còn hàng: ${uniqueAvailableSizes.join(", ")})`;
            }
            if (uniqueAvailableColors.length > 0) {
              variantInfo += ` (Màu còn hàng: ${uniqueAvailableColors.join(", ")})`;
            }
            
            if (uniqueAvailableSizes.length === 0 && uniqueAvailableColors.length === 0) {
              variantInfo += ` (⚠️ TẤT CẢ ĐÃ HẾT HÀNG)`;
            }
          }

          context += `${i + 1}. ${product.name} - ${formatVnd(product.price)}${variantInfo}\n`;
        });
      }
    } catch (error) {
      console.error("Error fetching brand for AI context:", error);
    }
  }

  return context;
};

const buildSystemPrompt = (storeInfo, userInfo, dynamicContext) =>
  `Bạn là trợ lý tư vấn OREBI - cửa hàng thời trang tại Đà Nẵng. Bạn đang trả lời bằng model Kiwi K2.6 (OpenRouter).
- Trả lời ngắn gọn, thân thiện, tiếng Việt
- Chỉ dùng dữ liệu ngữ cảnh được cung cấp, không bịa đặt
- Nếu không có thông tin, hướng dẫn khách hỏi đúng cách
- Tư vấn sản phẩm dựa trên dữ liệu thực tế của cửa hàng
- Giọng điệu: chuyên nghiệp nhưng gần gũi, như nhân viên tư vấn thực tế
- KHÔNG nhắc đến kỹ thuật, database, MongoDB, API hay chi tiết hệ thống
- Tập trung vào giúp khách hàng tìm sản phẩm và giải đáp thắc mắc liên quan đến cửa hàng
- Với câu hỏi nâng cao về cửa hàng hoặc sản phẩm, hãy:
  + phân tích các lựa chọn dựa trên dữ liệu tồn tại
  + so sánh ưu/nhược điểm giữa các loại sản phẩm
  + đề xuất 2-3 phương án nếu có thể
  + đưa ra quyết định phù hợp với nhu cầu, giá cả và phong cách của khách
  + nếu dữ liệu có sẵn thì trả lời cụ thể, không nói "không có thông tin" quá sớm
- Nếu người dùng hỏi dạng "sản phẩm + thể loại" (vd: "sản phẩm phụ kiện", "sản phẩm áo"), hãy:
  + ưu tiên trả lời theo đúng thể loại/ý người dùng
  + không cần nói lại danh sách hướng dẫn chung nếu có thể đưa ra sản phẩm cụ thể hoặc câu hỏi làm rõ (màu/giá/size/nhu cầu)
  + nếu không đủ thông tin để lọc chính xác, hỏi lại 1-2 câu ngắn (giá, size, nhu cầu) thay vì trả fallback
- Định nghĩa "sản phẩm bán chạy" dựa trên field dữ liệu '_type: "best_sellers"' và không tự suy luận chỉ từ soldQuantity
- Định nghĩa "hàng mới đến" dựa trên field dữ liệu '_type: "new_arrivals"'
- Có thể trả lời về: thông tin cửa hàng, danh mục sản phẩm, thương hiệu, giá cả, đánh giá, đơn hàng, giỏ hàng, thông tin cá nhân, chính sách shop

- QUAN TRỌNG: Khi trả lời về size/màu/tồn kho:
  + CHỈ sử dụng thông tin variants từ ngữ cảnh, không tự đoán hay bịa đặt
  + Nếu ngữ cảnh có "Biến thể: Đen: Size Free size (5)" → Đen có 1 size (Free size) với stock 5, KHÔNG PHẢI 5 size
  + Nếu ngữ cảnh có "Màu còn hàng: Đen, Xanh" → chỉ có 2 màu Đen và Xanh, KHÔNG có màu Hồng hay màu khác
  + Nếu ngữ cảnh có "Size còn hàng: Free size" → chỉ có 1 size Free size, KHÔNG có size khác
  + Số lượng trong ngoặc (5) là số lượng hàng tồn kho, không phải số lượng size
  + Nếu hết hàng (stock = 0 hoặc "⚠️ TẤT CẢ ĐÃ HẾT HÀNG"), báo rõ "Hết hàng (0 cái)" và recommend sản phẩm khác
  + Khi hỏi về màu sắc, CHỈ liệt kê màu có trong "Màu còn hàng" từ ngữ cảnh, KHÔNG thêm màu khác
  + Nếu không có thông tin màu trong ngữ cảnh, nói "Vui lòng kiểm tra trang sản phẩm để xem màu sắc có sẵn"
  + KHI HỎI VỀ SIZE CỤ THỂ (ví dụ: "có size 41 không?", "size 37 còn không?"):
    - Kiểm tra trong ngữ cảnh xem size đó có trong "Size còn hàng" không
    - Nếu có, trả lời: "Có, size [X] còn hàng" và liệt kê màu có sẵn cho size đó
    - Nếu không có nhưng size khác còn hàng, trả lời: "Size [X] hiện hết hàng, nhưng size [Y, Z] còn hàng"
    - Nếu tất cả size hết hàng, trả lời: "Tất cả size đã hết hàng" và recommend sản phẩm tương tự
    - KHÔNG bao giờ nói "Bạn có thể kiểm tra thông tin tồn kho trên trang sản phẩm" khi có thông tin trong ngữ cảnh

- Khi khách hỏi về kích thước (size) phù hợp với chiều cao cụ thể:
  + LUÔN recommend size dựa trên chiều cao: 
    * 1m50-1m60 → Size S, M
    * 1m60-1m70 → Size M, L (nếu khách cao trong khoảng này, prefer M)
    * 1m70-1m80 → Size L, XL (nếu khách cao 1m70, recommend M hoặc L)
    * 1m80+ → Size XL, XXL
  + KIỂM TRA KHẢ NĂNG THỰC TẾ từ ngữ cảnh (variants/stock) trước khi chốt size
    * TUYỆT ĐỐI không khuyến nghị bất kỳ size nào bị đánh dấu "(hết)" trong ngữ cảnh
    * Nếu ngữ cảnh cho thấy Size M (hết) hoặc stock M = 0 → KHÔNG recommend Size M
    * Chỉ recommend size mà trong ngữ cảnh có stock > 0 hoặc không bị đánh dấu "(hết)"
    * QUAN TRỌNG: Nếu ngữ cảnh có dòng "Size còn hàng: [danh sách]", CHỈ recommend các size trong danh sách đó
    * Nếu ngữ cảnh có "⚠️ TẤT CẢ SIZE ĐÃ HẾT HÀNG", phải báo khách rằng sản phẩm hiện hết hàng
  + Kiểm tra variants được cung cấp xem có size này không
  + Nếu exact size không có, recommend size xung quanh (ưu tiên size còn hàng; nếu có thể thì chọn size lớn hơn)
  + Giải thích: "Size [X] phù hợp với người cao 1m70 vì..." (kèm 1 chi tiết ngắn về tính phù hợp với chiều cao/biến thể)
  + Luôn hỏi: "Bạn muốn chọn size nào?" để xác nhận

- Khi khách hỏi về size/màu cụ thể và size/màu đó hết hàng:
  + Nếu size/màu được hỏi hết hàng, recommend size/màu khác còn hàng
  + Ví dụ: "Size M đã hết hàng, nhưng Size L và XL còn hàng. Size L sẽ phù hợp hơn nếu bạn cao 1m70 trở lên."
  + Nếu màu được hỏi hết hàng, recommend màu khác còn hàng: "Màu trắng đã hết, nhưng màu đen và xanh vẫn còn."
  + Luôn dựa trên thông tin variants trong ngữ cảnh để recommend chính xác

- Khi sản phẩm hết hàng (có đánh dấu "⚠️ HẾT HÀNG" hoặc "⚠️ TẤT CẢ ĐÃ HẾT HÀNG"):
  + Báo rõ cho khách biết sản phẩm đã hết hàng
  + Nếu ngữ cảnh có "💡 Sản phẩm tương tự còn hàng", recommend các sản phẩm đó cho khách
  + Giải thích ngắn gọn tại sao sản phẩm tương tự phù hợp (cùng category, cùng brand, giá tương tự)
  + Ví dụ: "Sản phẩm này hiện đã hết hàng. Tuy nhiên, bạn có thể xem sản phẩm tương tự [tên sản phẩm] cùng thương hiệu còn hàng với giá [giá]."
  + Nếu không có sản phẩm tương tự trong ngữ cảnh, hướng dẫn khách xem danh mục sản phẩm khác


- Khi khách hỏi về màu sắc, kích thước, chiều cao cụ thể:
  + kiểm tra dữ liệu sản phẩm được cung cấp trong ngữ cảnh
  + nếu có sản phẩm phù hợp, gợi ý sản phẩm đó với chi tiết ngắn gọn
  + nếu KHÔNG có sản phẩm phù hợp exactly, gợi ý sản phẩm gần nhất và giải thích lý do
  + hỏi thêm về sở thích, ngân sách để tư vấn tốt hơn
  + ví dụ: "Áo đỏ phù hợp người cao 1m7" → tìm áo đỏ, nếu không có thì gợi ý áo màu khác phù hợp chiều cao

- Khi khách hỏi về tư vấn sản phẩm:
  + dựa trên dữ liệu thực tế (sản phẩm bán chạy, mới nhất, có sẵn)
  + gợi ý 2-3 sản phẩm phù hợp nhất với yêu cầu
  + giải thích ngắn gọn tại sao sản phẩm đó phù hợp
  + nếu không có sản phẩm exactly match, gợi ý sản phẩm gần nhất

- Khi khách hỏi về thông tin cửa hàng (địa chỉ, liên hệ, bán ở đâu):
  + Sử dụng thông tin cửa hàng được cung cấp trong ngữ cảnh "THÔNG TIN CỬA HÀNG OREBI"
  + Trả lời chính xác địa chỉ, số điện thoại, email, thành phố
  + Có thể cung cấp thêm thông tin về số lượng sản phẩm, danh mục, đánh giá
  + Nếu ngữ cảnh có thông tin cửa hàng, sử dụng nó để trả lời chính xác
  + Nếu không có thông tin cụ thể, hướng dẫn khách liên hệ qua hotline/email

- Khi khách hỏi về thông tin cá nhân (tài khoản, hồ sơ):
  + Sử dụng thông tin cá nhân được cung cấp trong ngữ cảnh "THÔNG TIN CÁ NHÂN CỦA BẠN"
  + Chỉ trả lời thông tin về chính khách hàng đang hỏi (dựa trên userId)
  + Trả lời về tên, email, số điện thoại, địa chỉ nếu có trong ngữ cảnh
  + Nếu thông tin chưa cập nhật, báo khách cần cập nhật trong hồ sơ
  + KHÔNG bao giờ tiết lộ thông tin cá nhân của người khác

${storeInfo ? `
Thông tin cửa hàng:
- Tên: OREBI
- Địa chỉ: ${storeInfo.contact.address}, ${storeInfo.contact.city}
- Hotline: ${storeInfo.contact.displayPhone}
- Email: ${storeInfo.contact.email}
- Sản phẩm: ${storeInfo.inStockCount} đang còn hàng / ${storeInfo.productCount} tổng
- Danh mục: ${storeInfo.categoryNames}
- Sản phẩm bán chạy nhất hiện tại: ${storeInfo.bestSellerNames || "Không có thông tin"}
- Sản phẩm mới đến hiện tại: ${storeInfo.newArrivalNames || "Không có thông tin"}
` : ""}${userInfo ? userInfo : ""}${dynamicContext ? dynamicContext : ""}`;

const fetchUserInfoForAI = async (userId) => {
  if (!userId) return "";
  try {
    const profile = await fetchUserProfile(userId);
    if (!profile) return "";
    return `
Thông tin khách hàng:
- Tên: ${profile.name}
- Email: ${profile.email}
- SĐT: ${profile.phone}
- Vai trò: ${profile.role}`;
  } catch (error) {
    console.error("Error fetching user profile for AI:", error);
    return "";
  }
};

const tryOpenAI = async (message, contextReply, storeInfo = null, userId = null) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OpenAI skipped: OPENAI_API_KEY is not configured");
    return null;
  }
  try {
    const userInfo = await fetchUserInfoForAI(userId);
    // Sử dụng contextReply nếu đã có (từ fetchDynamicContext), nếu không thì fetch thêm
    const dynamicContext = contextReply || (await fetchDynamicContext(message, userId));
    const systemPrompt = buildSystemPrompt(storeInfo, userInfo, dynamicContext);

    console.log("tryOpenAI", { baseUrl: OPENAI_BASE_URL, model: OPENAI_MODEL });
    const endpoint = `${OPENAI_BASE_URL.replace(/\/+$/, "")}/chat/completions`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Khách hỏi: ${message}\n\nThông tin có sẵn:\n${contextReply}` },
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("OpenAI API error", res.status, res.statusText, errorText);
      return null;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim() || null;
    if (!content) {
      console.warn("OpenAI returned empty response", JSON.stringify(data).slice(0, 1000));
    }
    return content;
  } catch (error) {
    console.error("OpenAI request failed:", error);
    return null;
  }
};

const tryAI = async (message, contextReply, storeInfo = null, userId = null) => {
  return tryOpenAI(message, contextReply, storeInfo, userId);
};

const isCategoryIntent = (n) =>
  /the loai|thể loại|danh muc|danh mục|loai|loại|category/.test(n) ||
  (/san pham|sản phẩm|tim|tìm|mua|show/.test(n) && /ao|áo|giay|giày|quan|quần|phu kien|thể thao|mua dong/.test(n));

const isVariantIntent = (n) =>
  /size|có size|có size nào|size nào|size nào còn hàng|có size nào|kích thước|kích cỡ|con hàng|còn hàng|hết hàng|tồn kho|stock|mau|màu|color|có màu|có màu nào|màu gì|màu nào|bao nhiêu cái|còn bao nhiêu|số lượng|đã bán|có màu sắc|có màu sắc nào|có những màu nào/.test(n);

const isPriceIntent = (n) =>
  /gia|giá|price|tien|tiền|re nhat|rẻ|duoi|dưới|tren|trên|triệu|trieu|\d+k\b/.test(n) && parsePriceRange(n) != null;

const isRatingIntent = (n) =>
  /(?:[1-5]\s*(?:\-|\.\.|đến|den|từ|tu)\s*[1-5]\s*)?sao|danh gia|đánh giá|star|rating|review|điểm/.test(n);

const isStoreIntent = (n) => {
  const hasProductKeywords = /san pham|sản phẩm|ao|áo|giay|giày|quan|quần|phu kien|áo|quần|giày/.test(n);
  if (hasProductKeywords) return false;
  return /cua hang|cửa hàng|orebi|thong tin shop|ve chung toi|about/.test(n);
};

const isForgotPasswordIntent = (n) =>
  /quen mat khau|quên mật khẩu|mat khau|mật khẩu|reset password|doi mat khau|đổi mật khẩu|lay lai/.test(n);

const isContactIntent = (n) =>
  /lien he|liên hệ|hotline|email|địa chỉ|dia chi|gọi|goi|sdt|phone/.test(n);

const isBrandIntent = (n) =>
  /brand|thương hiệu|nike|adidas|puma|converse|vans/.test(n);

const isBestSellerIntent = (n) =>
  /ban chay|bán chạy|best seller|top|phổ biến|hot/.test(n);

const isNewArrivalIntent = (n) =>
  /moi nhat|moi-nhat|moi|new arrival|vua ve|vua-ve|hang moi|hang-moi|hangmoi/.test(n);

const isWhoAreYouIntent = (n) =>
  /ban la ai|bạn là ai|ai day|ai đây|ten gi|tên gì|giới thiệu/.test(n);

const isRecommendationIntent = (n) =>
  /nen mua gi|nên mua gì|goi y san pham|gợi ý sản phẩm|khuyen mua|recommend san pham/.test(n);

const isCartIntent = (n) =>
  /gio hang|giỏ hàng|cart|trong giỏ|trong cart|sản phẩm trong giỏ/.test(n);

const isProfileIntent = (n) =>
  /thong tin ca nhan|profile|tai khoan|tai khoan cua toi|thong tin cua toi|ho so|ca nhan/.test(n);

const isOrderIntent = (n) =>
  /don hang|đon hang|don cua toi|đơn hàng|theo doi don|theo dõi đơn|kiem tra don|kiểm tra đơn|trang thai don|trạng thái đơn/.test(n);

// Detect câu hỏi phức tạp có nhiều điều kiện (màu, kích thước, chiều cao, v.v.)
const isComplexQuery = (n) => {
  const hasColor = /do|đỏ|xanh|xanh duong|xanh dương|trắng|trang|den|đen|vàng|vang|hồng|hong|cam|tim|nâu|nau|xám|xam|be|bê|kem|kém|vàng chanh|vang chanh|mau|color/.test(n);
  const hasSize = /\b(size|kich co|kích cỡ|s\b|m\b|l\b|xl|xxl|xxxl|to|lớn|nhỏ|be|bê|just fit|fit|chuan|chuẩn)\b/.test(n);
  const hasHeight = /cao|thap|chieu cao|1m7|1m6|1m8|1m5|1m9|1m70|1m60|1m80|1m50|1m90|1m\d+/.test(n);
  const hasStyle = /phong cách|style|chất liệu|chất liêu|mặc|đi chơi|dự tiệc|đi học|đi làm|thể thao|công sở|du lịch/.test(n);
  const hasComparison = /so sánh|phân biệt|so sanh|khác nhau|tốt hơn|nên mua|nên chọn/.test(n);
  const hasSpecificRequirement = /phù hợp|tốt nhất|đẹp nhất|nên|nen|khuyên|gợi ý|goi y|tư vấn|tu van|tim|tìm|muốn|cần|can|nên mua|nên chọn/.test(n);

  // Nếu có "so sánh" → gọi AI tư vấn luôn
  if (hasComparison) return true;

  // Nếu có size + height + requirement → complex query (size recommendation dựa trên chiều cao)
  if ((hasSize && hasHeight) || (hasColor && hasHeight)) return true;

  // Nếu có attributes (màu, size, height, style) + requirement → gọi AI
  return (hasColor || hasSize || hasHeight || hasStyle) && hasSpecificRequirement;
};

export const processChatMessage = async (message, userId = null) => {
  const text = (message || "").trim();
  if (!text) return { reply: "Bạn vui lòng nhập câu hỏi nhé.", products: [] };

  const n = normalize(text);
  const storeInfo = await fetchStoreInfo();

  let result = null;

  // 1. Greeting / Cảm ơn
  if (/^(xin chào|chao|hello|hi|hey)\b/.test(n)) {
    result = { reply: GREETING_REPLY, products: [] };
    await saveChatHistory(userId, text, result.reply, result.products);
    return result;
  }

  if (/cam on|cảm ơn|thanks/.test(n)) {
    result = { reply: "Không có gì ạ! Cần tư vấn thêm cứ nhắn mình nhé 😊", products: [] };
    await saveChatHistory(userId, text, result.reply, result.products);
    return result;
  }

  // 2. Câu hỏi phức tạp (ưu tiên trước FAQ)
  if (isComplexQuery(n)) {
    const fallback = "Bạn có thể hỏi theo thể loại, giá, đánh giá, thương hiệu.";
    const context = await fetchDynamicContext(text, n);
    const ai = await tryAI(text, context, storeInfo, userId);
    result = { reply: ai || fallback, products: [] };
    await saveChatHistory(userId, text, result.reply, result.products);
    return result;
  }

  // 3. Variant intent - questions about size, color, stock (ưu tiên trước FAQ)
  if (isVariantIntent(n)) {
    const context = await fetchDynamicContext(text, n);
    
    // Nếu câu hỏi cụ thể về màu sắc, trả lời trực tiếp từ context
    if (/có màu nào|màu gì|màu nào|có màu sắc|có màu sắc nào|có những màu nào/.test(n)) {
      const keywordProducts = await searchProductsByKeyword(message, 3);
      if (keywordProducts && keywordProducts.length > 0) {
        let colorReply = "";
        keywordProducts.slice(0, 2).forEach((product) => {
          if (product.hasVariants && product.variants) {
            const availableColors = [...new Set(product.variants.filter(v => v.stock > 0).map(v => v.color))];
            const allColors = [...new Set(product.variants.map(v => v.color))];
            
            if (availableColors.length > 0) {
              colorReply += `${product.name}: Có màu ${availableColors.join(", ")}. `;
            } else if (allColors.length > 0) {
              colorReply += `${product.name}: Có màu ${allColors.join(", ")} nhưng hiện hết hàng. `;
            } else {
              colorReply += `${product.name}: Không có thông tin màu sắc. `;
            }
          } else {
            colorReply += `${product.name}: Không phân màu. `;
          }
        });
        
        if (colorReply) {
          result = { reply: colorReply, products: [] };
          await saveChatHistory(userId, text, result.reply, result.products);
          return result;
        }
      }
    }
    
    // Nếu câu hỏi cụ thể về size, trả lời trực tiếp từ context
    if (/có size nào|size gì|size nào|có kích thước nào|kích cỡ nào/.test(n)) {
      const keywordProducts = await searchProductsByKeyword(message, 3);
      if (keywordProducts && keywordProducts.length > 0) {
        let sizeReply = "";
        keywordProducts.slice(0, 2).forEach((product) => {
          if (product.hasVariants && product.variants) {
            const availableSizes = [...new Set(product.variants.filter(v => v.stock > 0).map(v => v.size))];
            const allSizes = [...new Set(product.variants.map(v => v.size))];
            
            if (availableSizes.length > 0) {
              sizeReply += `${product.name}: Có size ${availableSizes.join(", ")}. `;
            } else if (allSizes.length > 0) {
              sizeReply += `${product.name}: Có size ${allSizes.join(", ")} nhưng hiện hết hàng. `;
            } else {
              sizeReply += `${product.name}: Không phân size. `;
            }
          } else {
            sizeReply += `${product.name}: Không phân size (Free size). `;
          }
        });
        
        if (sizeReply) {
          result = { reply: sizeReply, products: [] };
          await saveChatHistory(userId, text, result.reply, result.products);
          return result;
        }
      }
    }
    
    // Nếu câu hỏi cụ thể về tồn kho của sản phẩm, trả lời trực tiếp từ context
    if (/còn hàng không|hết hàng không|tồn kho|stock|bao nhiêu cái|còn bao nhiêu|số lượng|đã bán|còn không|hết chưa/.test(n)) {
      const keywordProducts = await searchProductsByKeyword(message, 3);
      if (keywordProducts && keywordProducts.length > 0) {
        let stockReply = "";
        keywordProducts.slice(0, 2).forEach((product) => {
          const totalStock = product.hasVariants && product.variants 
            ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
            : (product.stock || 0);
          
          if (product.hasVariants && product.variants) {
            const inStockVariants = product.variants.filter(v => v.stock > 0);
            if (inStockVariants.length > 0) {
              stockReply += `${product.name}: Còn ${totalStock} cái (`;
              // Group by color and show sizes with stock
              const variantsByColor = {};
              inStockVariants.forEach(v => {
                if (!variantsByColor[v.color]) variantsByColor[v.color] = [];
                variantsByColor[v.color].push({ size: v.size, stock: v.stock });
              });
              
              const colorInfo = Object.entries(variantsByColor).map(([color, variants]) => {
                const sizeInfo = variants.map(v => `${v.size} (${v.stock})`).join(", ");
                return `${color}: ${sizeInfo}`;
              }).join("; ");
              
              stockReply += `${colorInfo}). `;
            } else {
              stockReply += `${product.name}: Hết hàng (0 cái). `;
            }
          } else {
            stockReply += `${product.name}: ${totalStock > 0 ? `Còn ${totalStock} cái` : "Hết hàng (0 cái)"}. `;
          }
        });
        
        if (stockReply) {
          result = { reply: stockReply, products: [] };
          await saveChatHistory(userId, text, result.reply, result.products);
          return result;
        }
      }
    }
    
    const ai = await tryAI(text, context, storeInfo, userId);
    result = { reply: ai || "Bạn có thể kiểm tra thông tin tồn kho trên trang sản phẩm.", products: [] };
    await saveChatHistory(userId, text, result.reply, result.products);
    return result;
  }

  // 4. FAQ - Ưu tiên câu hỏi phổ biến (giao hàng, đổi trả, thanh toán...)
  const faqResult = await handleFaqReply(text, n, storeInfo);
  if (faqResult) {
    result = faqResult;
    await saveChatHistory(userId, text, result.reply, result.products);
    return result;
  }

  // 5. Các intent cụ thể - xử lý nhanh và chính xác
  if (isWhoAreYouIntent(n)) {
    result = { reply: GREETING_REPLY, products: [] };
    await saveChatHistory(userId, text, result.reply, result.products);
    return result;
  }

  if (isForgotPasswordIntent(n)) {
    result = { reply: FORGOT_PASSWORD_REPLY, products: [] };
    await saveChatHistory(userId, text, result.reply, result.products);
    return result;
  }

  if (isContactIntent(n) && !isStoreIntent(n)) {
    result = { reply: CONTACT_REPLY, products: [] };
    await saveChatHistory(userId, text, result.reply, result.products);
    return result;
  }

  if (isStoreIntent(n)) {
    const reply = formatStoreInfoReply(storeInfo);
    result = { reply, products: [] };
    await saveChatHistory(userId, text, result.reply, result.products);
    return result;
  }

  if (/danh sach danh muc|danh sách danh mục|co nhung loai|có những loại/.test(n)) {
    const reply = await formatCategoryListReply();
    result = { reply, products: [] };
    await saveChatHistory(userId, text, result.reply, result.products);
    return result;
  }

  // Sản phẩm bán chạy
  if (isBestSellerIntent(n)) {
    const products = await fetchBestSellers();
    const { reply, products: cards } = buildProductReply(
      "🔥 **Sản phẩm bán chạy nhất**:",
      products
    );
    result = { reply, products: cards };
    await saveChatHistory(userId, text, result.reply, result.products);
    return result;
  }

  // Sản phẩm mới ra mắt
  if (isNewArrivalIntent(n)) {
    const products = await fetchNewArrivals();
    const { reply, products: cards } = buildProductReply(
      "✨ **Sản phẩm mới nhất** vừa về shop:",
      products
    );
    result = { reply, products: cards };
    await saveChatHistory(userId, text, result.reply, result.products);
    return result;
  }

  // Gợi ý sản phẩm
  if (isRecommendationIntent(n)) {
    const bestSellers = await fetchBestSellers();
    if (!bestSellers || bestSellers.length === 0) {
      result = { reply: "Hiện shop chưa có dữ liệu 'bán chạy' để hiển thị. Bạn có thể hỏi 'sản phẩm mới' hoặc 'giày dưới 1 triệu' nhé!", products: [] };
      await saveChatHistory(userId, text, result.reply, result.products);
      return result;
    }
    const { reply, products } = buildProductReply(
      "🔥 **Sản phẩm bán chạy nhất** (gợi ý cho bạn):",
      bestSellers
    );
    result = { reply, products };
    await saveChatHistory(userId, text, result.reply, result.products);
    return result;
  }

  // Rating - Ưu tiên trước category để tránh match nhầm "sản phẩm 1 sao" vào category
  if (isRatingIntent(n)) {
    const { minRating, maxRating, exactRating, products, hasReviews } = await searchProductsByRating(text);
    if (!hasReviews) {
      result = {
        reply: "Hiện tại **chưa có đánh giá** nào. Bạn mua và nhận hàng có thể đánh giá trên trang sản phẩm.",
        products: [],
      };
      await saveChatHistory(userId, text, result.reply, result.products);
      return result;
    }

    const intro = exactRating != null
      ? `Sản phẩm **${exactRating} sao**:`
      : maxRating != null
        ? `Sản phẩm **từ ${minRating} đến ${maxRating} sao**:`
        : `Sản phẩm **từ ${minRating} sao** trở lên:`;

    const { reply, products: cards } = buildProductReply(intro, products);
    result = { reply, products: cards };
    await saveChatHistory(userId, text, result.reply, result.products);
    return result;
  }

  // Category
  if (/^(sản phẩm|san pham|shop|shop me|sản-phẩm)\s+/.test(n) || isCategoryIntent(n)) {
    try {
      const isExplicitProductPrefix = /^(san pham|sản phẩm)\s+/.test(n);
      const hasCategoryHint =
        /phụ kiện|phu kien|áo|ao|giày|giay|quần|quan|thể thao|the thao|mùa đông|mua dong|mua-dong/.test(n);

      if (isExplicitProductPrefix || (isCategoryIntent(n) && hasCategoryHint)) {
        const { category, products } = await searchProductsByCategory(text);
        if (products && products.length) {
          const intro = `✨ **${category || 'Sản phẩm theo thể loại'}** mà bạn đang tìm:`;
          const built = buildProductReply(intro, products);
          result = { reply: built.reply, products: built.products };
          await saveChatHistory(userId, text, result.reply, result.products);
          return result;
        }
      }
    } catch (e) {
      // fallback
    }
  }

  // Brand
  if (isBrandIntent(n)) {
    const { brand, products } = await searchProductsByBrand(text);
    if (!brand) {
      const brands = await fetchBrands();
      if (brands.length) {
        const brandList = brands.map((b, i) => `${i + 1}. ${b}`).join("\n");
        const reply = `**Các thương hiệu có sẵn:**\n\n${brandList}\n\nBạn có thể hỏi: *"Sản phẩm Nike"* hoặc *"Thương hiệu Adidas"*`;
        result = { reply, products: [] };
        await saveChatHistory(userId, text, result.reply, result.products);
        return result;
      }
      result = { reply: "Hiện chưa có thông tin thương hiệu.", products: [] };
      await saveChatHistory(userId, text, result.reply, result.products);
      return result;
    }
    const intro = `Sản phẩm thương hiệu **${brand}**:`;
    const { reply, products: cards } = buildProductReply(intro, products);
    result = { reply, products: cards };
    await saveChatHistory(userId, text, result.reply, result.products);
    return result;
  }

  // Price
  if (isPriceIntent(n)) {
    const { range, products } = await searchProductsByPrice(text);
    const label = formatPriceRangeLabel(range);
    const intro = `Kết quả theo **giá** ${label}:`;
    const { reply, products: cards } = buildProductReply(intro, products);
    result = { reply, products: cards };
    await saveChatHistory(userId, text, result.reply, result.products);
    return result;
  }

  // Cart
  if (isCartIntent(n)) {
    if (!userId) {
      result = {
        reply: "Để xem giỏ hàng, bạn cần đăng nhập trước. Sau đó vào trang **Giỏ hàng** để xem chi tiết.",
        products: []
      };
      await saveChatHistory(userId, text, result.reply, result.products);
      return result;
    }

    const cartInfo = await fetchUserCartInfo(userId);
    if (!cartInfo || cartInfo.itemCount === 0) {
      const bestSellers = await fetchBestSellers();
      const { reply, products } = buildProductReply(
        "Giỏ hàng của bạn hiện đang trống. Đây là **sản phẩm bán chạy nhất** gợi ý cho bạn:",
        bestSellers
      );
      result = { reply, products };
      await saveChatHistory(userId, text, result.reply, result.products);
      return result;
    }

    const formatVnd = (n) =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(Number(n) || 0);

    let reply = `**Giỏ hàng của bạn:**\n• Số lượng: ${cartInfo.itemCount} sản phẩm\n• Tổng tiền: ${formatVnd(cartInfo.totalAmount)}\n\n`;

    if (cartInfo.items && cartInfo.items.length > 0) {
      reply += `**Sản phẩm trong giỏ:**\n`;
      cartInfo.items.forEach((item, index) => {
        reply += `${index + 1}. ${item.name}\n   • Giá: ${formatVnd(item.price)}\n   • Số lượng: ${item.quantity}\n   • Hãng: ${item.brand || "N/A"}\n   • Thể loại: ${item.category || "N/A"}\n`;
      });
    }

    reply += `\nXem chi tiết và thanh toán tại trang **Giỏ hàng**.`;

    const productCards = cartInfo.items.map(item => ({
      id: item._id,
      name: item.name,
      price: item.price,
      image: item.image || item.images?.[0] || "",
      category: item.category,
      avgRating: 0,
      reviewCount: 0,
    }));

    result = { reply, products: productCards };
    await saveChatHistory(userId, text, result.reply, result.products);
    return result;
  }

  // Profile
  if (isProfileIntent(n)) {
    if (!userId) {
      result = { reply: "Để xem thông tin cá nhân, bạn cần đăng nhập trước.", products: [] };
      await saveChatHistory(userId, text, result.reply, result.products);
      return result;
    }

    const profile = await fetchUserProfile(userId);
    if (!profile) {
      result = { reply: "Không tìm thấy thông tin của bạn. Vui lòng thử lại.", products: [] };
      await saveChatHistory(userId, text, result.reply, result.products);
      return result;
    }

    let reply = `**Thông tin cá nhân của bạn:**\n• Họ tên: ${profile.name}\n• Email: ${profile.email}\n• SĐT: ${profile.phone}\n• Vai trò: ${profile.role}`;

    if (profile.addresses && profile.addresses.length > 0) {
      reply += `\n\n**Địa chỉ:**`;
      profile.addresses.forEach((addr, index) => {
        reply += `\n${index + 1}. ${addr.address || addr.street || ""}${addr.city ? `, ${addr.city}` : ""}`;
      });
    } else {
      reply += `\n• Địa chỉ: Chưa cập nhật`;
    }

    if (profile.orderStats) {
      const formatVnd = (x) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
          maximumFractionDigits: 0,
        }).format(Number(x) || 0);

      reply += `\n\n**Lịch sử mua hàng:**\n• Tổng đơn: ${profile.orderStats.totalOrders}\n• Đã chi: ${formatVnd(profile.orderStats.totalSpent)}\n• Đang chờ: ${profile.orderStats.pendingOrders}\n• Đã giao: ${profile.orderStats.deliveredOrders}`;
    }

    reply += `\n\nCập nhật thông tin tại trang **Tài khoản**.`;

    result = { reply, products: [] };
    await saveChatHistory(userId, text, result.reply, result.products);
    return result;
  }

  // Order
  if (isOrderIntent(n)) {
    if (!userId) {
      result = { reply: "Để xem đơn hàng, bạn cần đăng nhập trước.", products: [] };
      await saveChatHistory(userId, text, result.reply, result.products);
      return result;
    }

    const orders = await fetchUserOrders(userId);
    if (!orders || orders.length === 0) {
      result = { reply: "Bạn chưa có đơn hàng nào.", products: [] };
      await saveChatHistory(userId, text, result.reply, result.products);
      return result;
    }

    const formatVnd = (n) =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(Number(n) || 0);

    let reply = `**Đơn hàng của bạn (${orders.length} đơn gần nhất):**\n\n`;
    orders.forEach((order, index) => {
      const statusMap = {
        "Pending": "Đang chờ",
        "Processing": "Đang xử lý",
        "Shipped": "Đã giao",
        "Delivered": "Đã nhận",
        "Cancelled": "Đã hủy"
      };
      const status = statusMap[order.status] || order.status;
      const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : "N/A";

      reply += `${index + 1}. **Đơn #${order._id.toString().slice(-6).toUpperCase()}** (${date})\n`;
      reply += `   • Trạng thái: ${status}\n`;
      reply += `   • Tổng tiền: ${formatVnd(order.amount)}\n`;

      if (order.items && order.items.length > 0) {
        const productNames = order.items.map(item => item.name).join(", ");
        reply += `   • Sản phẩm: ${productNames}\n`;
      }

      const totalQuantity = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      reply += `   • Số lượng: ${totalQuantity}\n\n`;
    });

    reply += `Xem chi tiết tại trang **Đơn hàng của tôi**.`;
    result = { reply, products: [] };
    await saveChatHistory(userId, text, result.reply, result.products);
    return result;
  }

  // 4. AI (OpenRouter) - Chỉ khi không match intent nào
  const fallback =
    "Mình có thể giúp bạn tìm:\n• **Thể loại** (vd: *Sản phẩm thể loại Giày*)\n• **Giá** (vd: *Giá dưới 500k*)\n• **Đánh giá** (vd: *Sản phẩm 4 sao*)\n• **Thương hiệu** (vd: *Sản phẩm Nike*)\n• **Bán chạy / Mới nhất**\n• **Cửa hàng** / **Liên hệ** / **Quên mật khẩu**\n• **Giỏ hàng** của bạn";

  const context = await fetchDynamicContext(text, n);
  const ai = await tryAI(text, context, storeInfo, userId);
  result = { reply: ai || fallback, products: [] };
  await saveChatHistory(userId, text, result.reply, result.products);
  return result;
};

