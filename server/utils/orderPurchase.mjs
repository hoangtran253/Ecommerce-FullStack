import orderModel from "../models/orderModel.js";

/** Đơn được coi là đã mua — đủ điều kiện đánh giá */
export const PURCHASED_ORDER_FILTER = {
  status: { $ne: "cancelled" },
};

export const isOrderEligibleForReview = (order) => {
  if (!order || order.status === "cancelled") return false;
  return true; // Cho phép đánh giá ngay sau khi đặt hàng
};

/** Tìm đơn đã mua của user có chứa productId (tuỳ chọn orderId) */
export const findUserPurchaseOrder = async (userId, productId, orderId = null) => {
  const query = {
    userId,
    ...PURCHASED_ORDER_FILTER,
    "items.productId": productId,
  };
  if (orderId) query._id = orderId;
  return orderModel.findOne(query).lean();
};
