import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import Container from "../components/Container";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSync,
} from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import ConfirmModal from "../components/ConfirmModal";
import Title from "../components/ui/title";

const Faq = () => {
  const { token } = useSelector((state) => state.auth);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [formData, setFormData] = useState({
    keys: "",
    answer: "",
    category: "general",
    isActive: true,
    priority: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, answer: "" });
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = [
    { value: "general", label: "Tổng quát" },
    { value: "shipping", label: "Giao hàng" },
    { value: "payment", label: "Thanh toán" },
    { value: "product", label: "Sản phẩm" },
    { value: "account", label: "Tài khoản" },
    { value: "return", label: "Đổi trả" },
    { value: "other", label: "Khác" },
  ];

  const fetchFaqs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/faq${categoryFilter !== "all" ? `?category=${categoryFilter}` : ""}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      if (data.success) {
        setFaqs(data.data);
      } else {
        toast.error(data.message || "Không thể tải danh sách FAQ");
      }
    } catch (error) {
      console.error("Lỗi khi tải FAQ:", error);
      toast.error("Không thể tải danh sách FAQ");
    } finally {
      setLoading(false);
    }
  }, [token, categoryFilter]);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleKeysChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      keys: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.keys.trim()) {
      toast.error("Từ khóa là bắt buộc");
      return;
    }

    if (!formData.answer.trim()) {
      toast.error("Câu trả lời là bắt buộc");
      return;
    }

    try {
      setSubmitting(true);
      const keysArray = formData.keys.split(",").map(k => k.trim()).filter(k => k);
      
      const payload = {
        keys: keysArray,
        answer: formData.answer,
        category: formData.category,
        isActive: formData.isActive,
        priority: formData.priority,
      };

      const url = editingFaq
        ? `${import.meta.env.VITE_BACKEND_URL}/api/faq/${editingFaq._id}`
        : `${import.meta.env.VITE_BACKEND_URL}/api/faq`;

      const method = editingFaq ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editingFaq ? "Cập nhật FAQ thành công" : "Tạo FAQ thành công");
        setShowModal(false);
        resetForm();
        fetchFaqs();
      } else {
        toast.error(data.message || "Không thể lưu FAQ");
      }
    } catch (error) {
      console.error("Lỗi khi lưu FAQ:", error);
      toast.error("Không thể lưu FAQ");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (faq) => {
    setEditingFaq(faq);
    setFormData({
      keys: faq.keys.join(", "),
      answer: faq.answer,
      category: faq.category,
      isActive: faq.isActive,
      priority: faq.priority,
    });
    setShowModal(true);
  };

  const openDeleteConfirm = (id, answer) => {
    setDeleteConfirm({ isOpen: true, id, answer });
  };

  const confirmDelete = async () => {
    const faqId = deleteConfirm.id;
    if (!faqId) return;

    try {
      setDeleting(true);
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/faq/${faqId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Đã xóa FAQ thành công");
        fetchFaqs();
      } else {
        toast.error(data.message || "Không thể xóa FAQ");
      }
    } catch (error) {
      console.error("Lỗi khi xóa FAQ:", error);
      toast.error("Không thể xóa FAQ");
    } finally {
      setDeleting(false);
      setDeleteConfirm({ isOpen: false, id: null, answer: "" });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, id: null, answer: "" });
  };

  const resetForm = () => {
    setFormData({
      keys: "",
      answer: "",
      category: "general",
      isActive: true,
      priority: 0,
    });
    setEditingFaq(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const filteredFaqs = faqs.filter((faq) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      faq.keys.some(k => k.toLowerCase().includes(searchLower)) ||
      faq.answer.toLowerCase().includes(searchLower)
    );
  });

  const getCategoryLabel = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <Container>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Title>Quản lý FAQ</Title>
            <p className="text-gray-600 mt-1">Quản lý câu hỏi thường gặp cho chatbot</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <FaPlus />
            Thêm FAQ
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm FAQ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <button
              onClick={fetchFaqs}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <FaSync />
              Làm mới
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Từ khóa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Câu trả lời</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh mục</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ưu tiên</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFaqs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      {searchTerm || categoryFilter !== "all"
                        ? "Không tìm thấy FAQ nào"
                        : "Chưa có FAQ nào"}
                    </td>
                  </tr>
                ) : (
                  filteredFaqs.map((faq) => (
                    <tr key={faq._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {faq.keys.map((key, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                              {key}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate text-gray-700">
                        {faq.answer}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {getCategoryLabel(faq.category)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            faq.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {faq.isActive ? "Hoạt động" : "Không hoạt động"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {faq.priority}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEditModal(faq)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Sửa"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(faq._id, faq.answer)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded ml-1"
                          title="Xóa"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    {editingFaq ? "Sửa FAQ" : "Thêm FAQ mới"}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <IoMdClose className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Từ khóa (ngăn cách bằng dấu phẩy)
                  </label>
                  <input
                    type="text"
                    name="keys"
                    value={formData.keys}
                    onChange={handleKeysChange}
                    placeholder="giao hàng, ship, bao lâu"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ví dụ: giao hàng, ship, bao lâu
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Câu trả lời
                  </label>
                  <textarea
                    name="answer"
                    value={formData.answer}
                    onChange={handleInputChange}
                    placeholder="Thời gian giao hàng tiêu chuẩn: 3–5 ngày làm việc..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Danh mục
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                    />
                    <span className="text-sm text-gray-700">Hoạt động</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Độ ưu tiên (số càng cao càng ưu tiên)
                  </label>
                  <input
                    type="number"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    min={0}
                    max={100}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                  >
                    {submitting ? "Đang lưu..." : editingFaq ? "Cập nhật" : "Thêm"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmModal
          open={deleteConfirm.isOpen}
          title="Xóa FAQ"
          message={`Bạn có chắc muốn xóa FAQ này? Hành động này không thể hoàn tác.`}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
          confirmLabel="Xóa FAQ"
          cancelLabel="Hủy"
          isLoading={deleting}
          type="danger"
        />
      </div>
    </Container>
  );
};

export default Faq;
