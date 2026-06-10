export const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

export const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const ORDER_STATUS_LABELS = {
  pending: "Đang chờ",
  confirmed: "Đã xác nhận",
  shipped: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

export const PAYMENT_STATUS_LABELS = {
  pending: "Chưa thanh toán",
  paid: "Đã thanh toán",
  failed: "Thất bại",
  refunded: "Hoàn tiền",
};

const VND_MIN_PRICE = 10000;
const MAX_REASONABLE = 50_000_000;

const isValidVnd = (n) => {
  const v = Number(n) || 0;
  return v >= VND_MIN_PRICE && v <= MAX_REASONABLE;
};

/** Tổng từ dòng SP — chỉ giá VND hợp lệ (API server đã enrich) */
export const calcOrderAmountFromItems = (items = []) =>
  (items || []).reduce((sum, item) => {
    const price = Number(item.price) || 0;
    if (!isValidVnd(price)) return sum;
    return sum + price * (Number(item.quantity) || 1);
  }, 0);

export const getOrderDisplayAmount = (order) => {
  const amount = Number(order?.amount) || 0;
  if (isValidVnd(amount)) return amount;
  const fromItems = calcOrderAmountFromItems(order?.items);
  return fromItems > 0 ? fromItems : 0;
};

export const getOrderCustomerName = (order) => {
  if (order?.userId?.name) return order.userId.name;
  const addr = order?.address;
  if (!addr) return "Khách hàng";
  if (addr.name) return addr.name;
  const full = [addr.firstName, addr.lastName].filter(Boolean).join(" ");
  return full || addr.email || "Khách hàng";
};

export const calcGrowthPercent = (current, previous) => {
  if (!previous || previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
};

export const PAYMENT_METHOD_LABELS = {
  cod: "COD",
  stripe: "Thẻ (Stripe)",
  paypal: "PayPal",
};

/** Tên SP trên dòng đơn (ưu tiên name lưu trong đơn, sau đó populate productId) */
export const getItemProductName = (item) => {
  if (!item) return "";
  if (item.name && typeof item.name === "string") return item.name;
  const p = item.productId;
  if (typeof p === "object" && p?.name) return p.name;
  return "";
};

/** Mỗi dòng SP trong đơn — hiển thị đủ tên + số lượng */
export const getOrderItemLines = (items = []) =>
  (items || []).map((item, index) => {
    const name = getItemProductName(item) || "Sản phẩm";
    const quantity = Number(item.quantity) || 1;
    return {
      key: item._id || item.productId?._id || `${name}-${index}`,
      name,
      quantity,
      selectedSize: item.selectedSize,
      selectedColor: item.selectedColor,
    };
  });

/** Chuỗi đầy đủ (tooltip / tìm kiếm) */
export const getOrderItemsLabel = (items = []) => {
  const lines = getOrderItemLines(items);
  if (!lines.length) return "—";
  return lines
    .map((l) => (l.quantity > 1 ? `${l.name} ×${l.quantity}` : l.name))
    .join(", ");
};

export const getOrderDateValue = (order) => {
  const raw = order?.date || order?.createdAt || order?.updatedAt;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatOrderDateTime = (order) => {
  const d = getOrderDateValue(order);
  if (!d) return "—";
  return formatDate(d);
};
