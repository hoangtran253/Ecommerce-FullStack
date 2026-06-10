export const NOTIF_SEEN_KEY = "orebi_admin_notif_seen_at";

export const getNotifSeenAt = () =>
  localStorage.getItem(NOTIF_SEEN_KEY) || null;

export const markNotifSeen = () => {
  localStorage.setItem(NOTIF_SEEN_KEY, new Date().toISOString());
};

export const formatRelativeTime = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 0) return "Vừa xong";

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;

  return new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const NOTIF_TYPE_META = {
  order: { label: "Đơn hàng", color: "bg-blue-100 text-blue-800" },
  payment: { label: "Thanh toán", color: "bg-green-100 text-green-800" },
  review: { label: "Đánh giá", color: "bg-yellow-100 text-yellow-800" },
  contact: { label: "Liên hệ", color: "bg-purple-100 text-purple-800" },
  user: { label: "Khách mới", color: "bg-indigo-100 text-indigo-800" },
  stock: { label: "Tồn kho", color: "bg-orange-100 text-orange-800" },
};
