import PropTypes from "prop-types";
import { FaTrash, FaExclamationTriangle } from "react-icons/fa";

export default function ConfirmModal({ open, title, message, onCancel, onConfirm, confirmLabel = "Xác nhận", cancelLabel = "Hủy", isLoading = false, type = "danger" }) {
  if (!open) return null;

  const isDanger = type === "danger";
  const iconBg = isDanger ? "bg-red-100" : "bg-yellow-100";
  const iconColor = isDanger ? "text-red-600" : "text-yellow-600";
  const confirmBg = "bg-black hover:bg-gray-800";
  const Icon = isDanger ? FaTrash : FaExclamationTriangle;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="text-center">
          <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${iconBg} mb-4`}>
            <Icon className={`h-8 w-8 ${iconColor}`} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">{message}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-5 py-2.5 text-sm font-medium text-white ${confirmBg} rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px] flex items-center justify-center gap-2`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xóa...
                </>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

ConfirmModal.propTypes = {
  open: PropTypes.bool,
  title: PropTypes.string,
  message: PropTypes.string,
  onCancel: PropTypes.func,
  onConfirm: PropTypes.func,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  isLoading: PropTypes.bool,
  type: PropTypes.oneOf(['danger', 'warning']),
};
