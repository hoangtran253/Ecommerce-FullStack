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
  FaExternalLinkAlt,
  FaSync,
} from "react-icons/fa";
import { IoMdClose } from "react-icons/io";

const Brands = () => {
  const { token } = useSelector((state) => state.auth);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    website: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Lấy danh sách thương hiệu
  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/brand`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      if (data.success) {
        setBrands(data.brands);
      } else {
        toast.error(data.message || "Không thể tải danh sách thương hiệu");
      }
    } catch (error) {
      console.error("Lỗi khi tải thương hiệu:", error);
      toast.error("Không thể tải danh sách thương hiệu");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // Xử lý khi nhập form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Xử lý khi chọn ảnh
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

  // Gửi form tạo/sửa thương hiệu
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Tên thương hiệu là bắt buộc");
      return;
    }

    if (!formData.image && !editingBrand) {
      toast.error("Vui lòng chọn ảnh logo thương hiệu");
      return;
    }

    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name.trim());
      formDataToSend.append("description", formData.description.trim());
      formDataToSend.append("website", formData.website.trim());
      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      const url = editingBrand
        ? `${import.meta.env.VITE_BACKEND_URL}/api/brand/${editingBrand._id}`
        : `${import.meta.env.VITE_BACKEND_URL}/api/brand`;

      const response = await fetch(url, {
        method: editingBrand ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          editingBrand
            ? "Cập nhật thương hiệu thành công"
            : "Tạo thương hiệu thành công"
        );
        fetchBrands();
        closeModal();
      } else {
        toast.error(data.message || "Lưu thương hiệu thất bại");
      }
    } catch (error) {
      console.error("Lỗi khi lưu thương hiệu:", error);
      toast.error("Lưu thương hiệu thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  // Xóa thương hiệu
  const handleDelete = async (brandId) => {
    if (!window.confirm("Bạn có chắc muốn xóa thương hiệu này không?")) {
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/brand/${brandId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Đã xóa thương hiệu thành công");
        fetchBrands();
      } else {
        toast.error(data.message || "Không thể xóa thương hiệu");
      }
    } catch (error) {
      console.error("Lỗi khi xóa thương hiệu:", error);
      toast.error("Không thể xóa thương hiệu");
    }
  };

  // Mở modal thêm/sửa thương hiệu
  const openModal = (brand = null) => {
    if (brand) {
      setEditingBrand(brand);
      setFormData({
        name: brand.name,
        description: brand.description || "",
        website: brand.website || "",
        image: null,
      });
      setImagePreview(brand.image);
    } else {
      setEditingBrand(null);
      setFormData({
        name: "",
        description: "",
        website: "",
        image: null,
      });
      setImagePreview("");
    }
    setShowModal(true);
  };

  // Đóng modal
  const closeModal = () => {
    setShowModal(false);
    setEditingBrand(null);
    setFormData({
      name: "",
      description: "",
      website: "",
      image: null,
    });
    setImagePreview("");
  };

  // Lọc thương hiệu theo tìm kiếm
  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Thương hiệu
            </h1>
            <p className="text-gray-600 mt-1">
              Quản lý các thương hiệu sản phẩm
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchBrands}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              title="Làm mới danh sách thương hiệu"
            >
              <FaSync className="w-4 h-4" />
              Làm mới
            </button>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <FaPlus />
              Thêm thương hiệu
            </button>
          </div>
        </div>

        {/* Tìm kiếm */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm thương hiệu..."
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
        ) : filteredBrands.length === 0 ? (
          <div className="text-center py-12">
            <FaImage className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm ? "Không tìm thấy thương hiệu" : "Chưa có thương hiệu"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm
                ? "Hãy thử tìm kiếm với từ khóa khác"
                : "Bắt đầu bằng cách tạo thương hiệu đầu tiên"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => openModal()}
                className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Tạo thương hiệu
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBrands.map((brand) => (
              <div
                key={brand._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="w-full h-32 mb-4 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                    <img
                      src={brand.image}
                      alt={brand.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-1">
                    {brand.name}
                  </h3>
                  {brand.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {brand.description}
                    </p>
                  )}
                  {brand.website && (
                    <a
                      href={brand.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4"
                    >
                      <FaExternalLinkAlt className="text-xs" />
                      Website
                    </a>
                  )}
                  <div className="flex gap-2 pt-3 border-t">
                    <button
                      onClick={() => openModal(brand)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <FaEdit />
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(brand._id)}
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

        {/* Modal thêm/sửa thương hiệu */}
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
                  {editingBrand ? "Chỉnh sửa thương hiệu" : "Thêm thương hiệu"}
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
                    Tên thương hiệu *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Nhập tên thương hiệu"
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
                    placeholder="Nhập mô tả thương hiệu"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="https://ten-thuong-hieu.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo thương hiệu *
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
                      : editingBrand
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

export default Brands;
