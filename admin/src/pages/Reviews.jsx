import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import { FaStar, FaTrash, FaEdit, FaSync } from "react-icons/fa";
import Title from "../components/ui/title";
import UserAvatar from "../components/UserAvatar";
import SkeletonLoader from "../components/SkeletonLoader";
import ConfirmModal from "../components/ConfirmModal";
import { serverUrl } from "../../config";

const Reviews = () => {
  const { token } = useSelector((state) => state.auth);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, productName: "" });
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState({
    rating: 5,
    comment: "",
    reviewerName: "",
    isApproved: true,
  });

  const headers = { Authorization: `Bearer ${token}` };

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${serverUrl}/api/review/list`, { headers });
      if (res.data.success) {
        setReviews(res.data.reviews || []);
      } else {
        toast.error(res.data.message || "Không tải được đánh giá");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchReviews();
  }, [token, fetchReviews]);

  const openEdit = (review) => {
    setEditing(review);
    setForm({
      rating: review.rating,
      comment: review.comment,
      reviewerName: review.reviewerName,
      isApproved: review.isApproved !== false,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const res = await axios.put(
        `${serverUrl}/api/review/${editing._id}`,
        form,
        { headers }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setEditing(null);
        fetchReviews();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Cập nhật thất bại");
    }
  };

  const handleDelete = async (id) => {
    const review = reviews.find(r => r._id === id);
    setDeleteConfirm({ isOpen: true, id, productName: review?.productId?.name || "sản phẩm này" });
  };

  const confirmDelete = async () => {
    const reviewId = deleteConfirm.id;
    if (!reviewId) return;
    try {
      setIsDeleting(true);
      const res = await axios.delete(`${serverUrl}/api/review/${reviewId}`, {
        headers,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchReviews();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Xóa thất bại");
    } finally {
      setIsDeleting(false);
      setDeleteConfirm({ isOpen: false, id: null, productName: "" });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, id: null, productName: "" });
  };

  const toggleApproved = async (review) => {
    try {
      const res = await axios.put(
        `${serverUrl}/api/review/${review._id}`,
        { isApproved: !review.isApproved },
        { headers }
      );
      if (res.data.success) fetchReviews();
    } catch {
      toast.error("Không thể đổi trạng thái");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonLoader type="dashboard" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Title>Quản lý đánh giá</Title>
          <p className="text-gray-600 mt-1">Duyệt, sửa và xóa đánh giá khách hàng trên sản phẩm</p>
          <p className="text-gray-600 mt-1">
            Tổng số lượng đánh giá: <span className="font-semibold">{reviews.length}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={fetchReviews}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <FaSync /> Làm mới
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-4 py-3">Khách</th>
                <th className="px-4 py-3">Sao</th>
                <th className="px-4 py-3">Nhận xét</th>
                <th className="px-4 py-3">Hiển thị</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    Chưa có đánh giá
                  </td>
                </tr>
              ) : (
                reviews.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium max-w-[180px] truncate">
                      {r.productId?.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          src={r.userId?.avatar}
                          name={r.reviewerName || r.userId?.name}
                          email={r.userId?.email}
                          size={28}
                        />
                        <span className="truncate max-w-[120px]">
                          {r.reviewerName || r.userId?.name || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-0.5 text-yellow-500">
                        {r.rating}
                        <FaStar className="w-3 h-3" />
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                      {r.comment}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleApproved(r)}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          r.isApproved
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {r.isApproved ? "Đang hiện" : "Ẩn"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(r)}
                        className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r._id)}
                        className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors ml-1"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 mx-auto"
          >
            <h3 className="text-lg font-semibold">Sửa đánh giá</h3>
            <p className="text-sm text-gray-500">
              SP: {editing.productId?.name}
            </p>
            <div>
              <label className="block text-sm font-medium mb-1">Tên hiển thị</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={form.reviewerName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reviewerName: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Số sao (1–5)</label>
              <input
                type="number"
                min={1}
                max={5}
                className="w-full border rounded-lg px-3 py-2"
                value={form.rating}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rating: Number(e.target.value) }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nhận xét</label>
              <textarea
                rows={4}
                className="w-full border rounded-lg px-3 py-2"
                value={form.comment}
                onChange={(e) =>
                  setForm((f) => ({ ...f, comment: e.target.value }))
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isApproved}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isApproved: e.target.checked }))
                }
              />
              Hiển thị trên trang sản phẩm
            </label>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="flex-1 py-2 border rounded-lg"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-gray-900 text-white rounded-lg"
              >
                Lưu
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteConfirm.isOpen}
        title="Xóa đánh giá"
        message={`Bạn có chắc muốn xóa đánh giá cho sản phẩm "${deleteConfirm.productName}"? Hành động này không thể hoàn tác.`}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        confirmLabel="Xóa đánh giá"
        cancelLabel="Hủy"
        isLoading={isDeleting}
        type="danger"
      />
    </div>
  );
};

export default Reviews;
