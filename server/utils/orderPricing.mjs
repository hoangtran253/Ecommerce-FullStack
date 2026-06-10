import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";

/** Giá VND hợp lệ trong shop (seed / sản phẩm) */
export const VND_MIN_PRICE = 10000;
export const MAX_REASONABLE_UNIT = 50_000_000;

export const COUNTABLE_ORDER_MATCH = {
  status: { $ne: "cancelled" },
  $or: [
    { paymentStatus: "paid" },
    { status: { $in: ["shipped", "delivered"] } },
  ],
};

export const PAID_SALES_MATCH = {
  status: { $ne: "cancelled" },
  paymentStatus: "paid",
};

const isValidVnd = (n) => {
  const v = Number(n) || 0;
  return v >= VND_MIN_PRICE && v <= MAX_REASONABLE_UNIT;
};

/** Ưu tiên giá catalog; không quy đổi USD (tránh 44 → 1.034.000.000) */
export const resolveItemUnitPrice = (item, catalogPrice = null) => {
  const catalog = Number(catalogPrice) || 0;
  if (isValidVnd(catalog)) return catalog;

  const populated = item?.productId;
  if (populated && typeof populated === "object" && isValidVnd(populated.price)) {
    return Number(populated.price);
  }

  const stored = Number(item?.price) || 0;
  if (isValidVnd(stored)) return stored;

  return 0;
};

export const loadProductPriceMap = async (productIds) => {
  const ids = [
    ...new Set(
      productIds
        .filter(Boolean)
        .map((id) => (id?._id ? id._id : id))
        .map(String)
    ),
  ];
  if (!ids.length) return new Map();

  const products = await productModel
    .find({ _id: { $in: ids } })
    .select("price")
    .lean();

  return new Map(products.map((p) => [String(p._id), p.price]));
};

export const loadProductPriceByName = async (names) => {
  const unique = [...new Set(names.filter(Boolean))];
  if (!unique.length) return new Map();

  const products = await productModel
    .find({ name: { $in: unique } })
    .select("name price")
    .lean();

  return new Map(products.map((p) => [p.name, p.price]));
};

export const buildPricingContext = async (orders) => {
  const productIds = [];
  const names = [];

  for (const order of orders) {
    for (const item of order.items || []) {
      const pid = item.productId?._id || item.productId;
      if (pid) productIds.push(pid);
      if (item.name) names.push(item.name);
    }
  }

  const [byId, byName] = await Promise.all([
    loadProductPriceMap(productIds),
    loadProductPriceByName(names),
  ]);

  return { byId, byName };
};

export const getCatalogPriceForItem = (item, ctx) => {
  const populated = item?.productId;
  if (populated && typeof populated === "object" && isValidVnd(populated.price)) {
    return Number(populated.price);
  }

  const id = populated?._id || item?.productId;
  if (id && ctx.byId.has(String(id))) {
    return ctx.byId.get(String(id));
  }

  if (item?.name && ctx.byName.has(item.name)) {
    return ctx.byName.get(item.name);
  }

  return null;
};

export const calcItemsTotalVnd = (items = [], ctx) =>
  (items || []).reduce((sum, item) => {
    const qty = Number(item.quantity) || 1;
    const catalog = getCatalogPriceForItem(item, ctx);
    const unit = resolveItemUnitPrice(item, catalog);
    return sum + unit * qty;
  }, 0);

export const normalizeOrderItems = (items = [], ctx) =>
  (items || []).map((item) => {
    const catalog = getCatalogPriceForItem(item, ctx);
    return {
      ...item,
      price: resolveItemUnitPrice(item, catalog),
    };
  });

export const resolveOrderAmount = (order, ctx) => {
  const fromItems = calcItemsTotalVnd(order.items, ctx);
  if (fromItems > 0) return fromItems;

  const stored = Number(order.amount) || 0;
  if (isValidVnd(stored)) return stored;

  return 0;
};

export const enrichOrdersWithVndPricing = async (orders) => {
  const ctx = await buildPricingContext(orders);

  return orders.map((order) => {
    const items = normalizeOrderItems(order.items, ctx);
    const amount = resolveOrderAmount({ ...order, items }, ctx);
    return { ...order, items, amount };
  });
};

export const aggregatePaidSales = async (extraMatch = {}) => {
  const orders = await orderModel
    .find({ ...PAID_SALES_MATCH, ...extraMatch })
    .select("items")
    .lean();

  const ctx = await buildPricingContext(orders);

  let totalUnitsSold = 0;
  let totalRevenue = 0;

  for (const order of orders) {
    for (const item of order.items || []) {
      const qty = Number(item.quantity) || 1;
      const catalog = getCatalogPriceForItem(item, ctx);
      const unit = resolveItemUnitPrice(item, catalog);
      totalUnitsSold += qty;
      totalRevenue += unit * qty;
    }
  }

  return { totalUnitsSold, totalRevenue };
};
