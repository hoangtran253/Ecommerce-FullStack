import orderModel from "../models/orderModel.js";
import Contact from "../models/contactModel.js";
import reviewModel from "../models/reviewModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import { REGISTERED_CUSTOMER_FILTER } from "../utils/userStats.mjs";

const getOrderCustomerName = (order) => {
  if (order?.userId?.name) return order.userId.name;
  const addr = order?.address;
  if (!addr) return "Khách hàng";
  if (addr.name) return addr.name;
  const full = [addr.firstName, addr.lastName].filter(Boolean).join(" ");
  return full || addr.email || "Khách hàng";
};

const DAYS_BACK = 30;
const LIMIT = 20;

const sinceDate = () => {
  const d = new Date();
  d.setDate(d.getDate() - DAYS_BACK);
  return d;
};

const orderLabel = (order) =>
  `#${String(order._id).slice(-8).toUpperCase()}`;

/** GET /api/notifications/admin — thông báo tổng hợp từ đơn, thanh toán, đánh giá, liên hệ, user */
export const getAdminNotifications = async (req, res) => {
  try {
    const from = sinceDate();
    const items = [];

    const [orders, contacts, reviews, users, lowStock] = await Promise.all([
      orderModel
        .find({ date: { $gte: from } })
        .sort({ date: -1 })
        .limit(LIMIT)
        .populate("userId", "name email")
        .lean(),
      Contact.find({ createdAt: { $gte: from } })
        .sort({ createdAt: -1 })
        .limit(LIMIT)
        .lean(),
      reviewModel
        .find({ createdAt: { $gte: from } })
        .sort({ createdAt: -1 })
        .limit(LIMIT)
        .populate("productId", "name")
        .lean(),
      userModel
        .find({ ...REGISTERED_CUSTOMER_FILTER, createdAt: { $gte: from } })
        .sort({ createdAt: -1 })
        .limit(LIMIT)
        .select("name email createdAt")
        .lean(),
      productModel
        .find({ stock: { $lte: 5 } })
        .sort({ stock: 1, updatedAt: -1 })
        .limit(8)
        .select("name stock updatedAt")
        .lean(),
    ]);

    for (const order of orders) {
      const customer = getOrderCustomerName(order);
      const label = orderLabel(order);
      const amount = Number(order.amount) || 0;
      const amountText =
        amount >= 10000
          ? `${amount.toLocaleString("vi-VN")} đ`
          : `${amount.toLocaleString("vi-VN")} đ`;

      if (order.paymentStatus === "paid") {
        items.push({
          id: `payment-${order._id}`,
          type: "payment",
          title: `Thanh toán đơn ${label}`,
          message: `${customer} · ${amountText}`,
          createdAt: order.date || order.createdAt,
          link: "/orders",
        });
      } else {
        items.push({
          id: `order-${order._id}`,
          type: "order",
          title: `Đơn hàng mới ${label}`,
          message: `${customer} · ${order.status || "pending"}`,
          createdAt: order.date || order.createdAt,
          link: "/orders",
        });
      }
    }

    for (const c of contacts) {
      const preview =
        c.message?.length > 70 ? `${c.message.slice(0, 70)}…` : c.message;
      items.push({
        id: `contact-${c._id}`,
        type: "contact",
        title:
          c.status === "unread" ? "Tin nhắn liên hệ mới" : "Tin nhắn liên hệ",
        message: `${c.name}: ${preview}`,
        createdAt: c.createdAt,
        link: "/contacts",
        highlight: c.status === "unread",
      });
    }

    for (const r of reviews) {
      items.push({
        id: `review-${r._id}`,
        type: "review",
        title: "Đánh giá sản phẩm mới",
        message: `${r.reviewerName} · ${r.rating}★ · ${r.productId?.name || "Sản phẩm"}`,
        createdAt: r.createdAt,
        link: "/reviews",
      });
    }

    for (const u of users) {
      items.push({
        id: `user-${u._id}`,
        type: "user",
        title: "Khách đăng ký mới",
        message: u.name || u.email,
        createdAt: u.createdAt,
        link: "/users",
      });
    }

    for (const p of lowStock) {
      items.push({
        id: `stock-${p._id}`,
        type: "stock",
        title: "Cảnh báo tồn kho thấp",
        message: `${p.name} · còn ${p.stock} sp`,
        createdAt: p.updatedAt || new Date(),
        link: "/inventory",
      });
    }

    items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const since = req.query.since;
    let unreadCount = items.length;
    if (since) {
      const t = new Date(since).getTime();
      if (!Number.isNaN(t)) {
        unreadCount = items.filter(
          (i) => new Date(i.createdAt).getTime() > t
        ).length;
      }
    }

    res.json({
      success: true,
      notifications: items,
      total: items.length,
      unreadCount,
    });
  } catch (error) {
    console.error("getAdminNotifications:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Không tải được thông báo",
    });
  }
};
