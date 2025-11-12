import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import Container from "../components/Container";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaImage,
  FaSearch,
  FaSync,
} from "react-icons/fa";
import { IoMdClose } from "react-icons/io";

const Categories = () => {
  const { token } = useSelector((state) => state.auth);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Lấy danh mục từ API
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/category`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();

      if (data.success) {
        setCategories(data.categories);
      } else {
        toast.error(data.message || "Không thể tải danh mục");
      }
    } catch (error) {
      console.error("Lỗi khi tải danh mục:", error);
      toast.error("Không thể tải danh mục");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Xử lý thay đổi input form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Xử lý chọn ảnh
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file,
      }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Gửi form thêm/sửa danh mục
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Tên danh mục là bắt buộc");
      return;
    }

    if (!formData.image && !editingCategory) {
      toast.error("Vui lòng chọn hình ảnh danh mục");
      return;
    }

    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name.trim());
      formDataToSend.append("description", formData.description.trim());
      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      const url = editingCategory
        ? `${import.meta.env.VITE_BACKEND_URL}/api/category/${editingCategory._id}`
        : `${import.meta.env.VITE_BACKEND_URL}/api/category`;

      const response = await fetch(url, {
        method: editingCategory ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          editingCategory ? "Cập nhật danh mục thành công" : "Thêm danh mục thành công"
        );
        fetchCategories();
        closeModal();
      } else {
        toast.error(data.message || "Không thể lưu danh mục");
      }
    } catch (error) {
      console.error("Lỗi khi lưu danh mục:", error);
      toast.error("Không thể lưu danh mục");
    } finally {
      setSubmitting(false);
    }
  };

  // Xóa danh mục
  const handleDelete = async (categoryId) => {
    if (!window.confirm("Bạn có chắc muốn xóa danh mục này?")) {
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/category/${categoryId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Xóa danh mục thành công");
        fetchCategories();
      } else {
        toast.error(data.message || "Không thể xóa danh mục");
      }
    } catch (error) {
      console.error("Lỗi khi xóa danh mục:", error);
      toast.error("Không thể xóa danh mục");
    }
  };

  // Mở modal thêm/sửa danh mục
  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || "",
        image: null,
      });
      setImagePreview(category.image);
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        description: "",
        image: null,
      });
      setImagePreview("");
    }
    setShowModal(true);
  };

  // Đóng modal
  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      image: null,
    });
    setImagePreview("");
  };

  // Lọc danh mục theo tìm kiếm
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Danh mục sản phẩm
            </h1>
            <p className="text-gray-600 mt-1">Quản lý các danh mục sản phẩm</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchCategories}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              title="Tải lại danh mục"
            >
              <FaSync className="w-4 h-4" />
              Làm mới
            </button>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <FaPlus />
              Thêm danh mục
            </button>
          </div>
        </div>

        {/* Ô tìm kiếm */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm danh mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse"
              >
                <div className="w-full h-32 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <FaImage className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm ? "Không tìm thấy danh mục nào" : "Chưa có danh mục nào"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm
                ? "Hãy thử thay đổi từ khóa tìm kiếm"
                : "Hãy bắt đầu bằng cách thêm danh mục đầu tiên của bạn"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => openModal()}
                className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Thêm danh mục
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCategories.map((category) => (
              <div
                key={category._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="w-full h-32 mb-4 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-1">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  <div className="flex gap-2 pt-3 border-t">
                    <button
                      onClick={() => openModal(category)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <FaEdit />
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(category._id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <FaTrash />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal thêm/sửa danh mục */}
        {showModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeModal();
              }
            }}
          >
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold">
                  {editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <IoMdClose size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên danh mục *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Nhập tên danh mục"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Nhập mô tả danh mục (nếu có)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hình ảnh danh mục *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  {imagePreview && (
                    <div className="mt-3">
                      <img
                        src={imagePreview}
                        alt="Xem trước"
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {submitting
                      ? "Đang lưu..."
                      : editingCategory
                      ? "Cập nhật"
                      : "Tạo mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

export default Categories;
