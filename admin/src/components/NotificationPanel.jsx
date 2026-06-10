import { useNavigate } from "react-router-dom";
import {
  FaTimes,
  FaShoppingBag,
  FaCreditCard,
  FaStar,
  FaEnvelope,
  FaUserPlus,
  FaExclamationTriangle,
} from "react-icons/fa";
import { formatRelativeTime, NOTIF_TYPE_META } from "../utils/notifications";

const TYPE_ICONS = {
  order: FaShoppingBag,
  payment: FaCreditCard,
  review: FaStar,
  contact: FaEnvelope,
  user: FaUserPlus,
  stock: FaExclamationTriangle,
};

const NotificationPanel = ({ notifications, onClose }) => {
  const navigate = useNavigate();

  const handleGo = (link) => {
    onClose();
    if (link) navigate(link);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Đóng"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Tất cả thông báo</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Đơn hàng, thanh toán, đánh giá, liên hệ và khách mới
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <FaTimes />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {notifications.length === 0 ? (
            <p className="text-center text-gray-500 py-16">
              Chưa có thông báo trong 30 ngày gần đây
            </p>
          ) : (
            notifications.map((n) => {
              const Icon = TYPE_ICONS[n.type] || FaShoppingBag;
              const meta = NOTIF_TYPE_META[n.type] || NOTIF_TYPE_META.order;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleGo(n.link)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors hover:bg-gray-50 ${
                    n.highlight
                      ? "border-purple-200 bg-purple-50/50"
                      : "border-gray-100"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 text-sm">
                        {n.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5 truncate">
                        {n.message}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="px-6 py-3 border-t bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-500 text-center">
            Bấm vào từng mục để mở trang quản lý tương ứng
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
