import productModel from "../models/productModel.js";

export const parseCartKey = (key) => {
  if (!key) return null;
  const k = String(key);
  if (k.length === 24) return { productId: k, size: null };
  if (k.length > 25 && k[24] === "_") {
    return { productId: k.slice(0, 24), size: k.slice(25) || null };
  }
  return { productId: k, size: null };
};

export const buildCartKey = (productId, size) => {
  const id = String(productId);
  return size ? `${id}_${size}` : id;
};

export const formatProductForCart = (product, quantity, size = null) => ({
  _id: product._id,
  name: product.name,
  images: product.images || [],
  image: product.images?.[0] || "",
  price: product.price,
  discountedPercentage: product.discountedPercentage ?? 0,
  stock: product.stock,
  category: product.category,
  brand: product.brand || "",
  offer: product.offer,
  quantity: Number(quantity) || 1,
  ...(size ? { size } : {}),
});

export const hydrateCartItems = async (cartMap = {}) => {
  const entries = Object.entries(cartMap);
  if (!entries.length) return [];

  const parsed = entries
    .map(([key, quantity]) => {
      const p = parseCartKey(key);
      if (!p?.productId) return null;
      return { ...p, quantity: Number(quantity) || 1 };
    })
    .filter(Boolean);

  const productIds = [...new Set(parsed.map((p) => p.productId))];
  const products = await productModel.find({ _id: { $in: productIds } }).lean();

  const items = [];
  for (const row of parsed) {
    const product = products.find((p) => String(p._id) === row.productId);
    if (product) {
      items.push(formatProductForCart(product, row.quantity, row.size));
    }
  }
  return items;
};

export const itemsToCartMap = (items = []) => {
  const userCart = {};
  for (const item of items) {
    if (!item?._id) continue;
    const qty = Number(item.quantity) || 0;
    if (qty <= 0) continue;
    const key = buildCartKey(item._id, item.size);
    userCart[key] = qty;
  }
  return userCart;
};
