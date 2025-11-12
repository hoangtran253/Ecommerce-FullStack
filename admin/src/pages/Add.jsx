import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Title from "../components/ui/title";
import { IoMdAdd, IoMdCloudUpload } from "react-icons/io";
import { FaTimes } from "react-icons/fa";
import Input, { Label } from "../components/ui/input";
import toast from "react-hot-toast";
import { serverUrl } from "../../config";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import SmallLoader from "../components/SmallLoader";

const Add = ({ token }) => {
  const [isLoading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    _type: "",
    name: "",
    description: "",
    brand: "",
    price: "",
    discountedPercentage: 10,
    stock: "",
    category: "",
    offer: false,
    isAvailable: true,
    badge: false,
    tags: [],
  });
  const [imageFiles, setImageFiles] = useState({
    image1: null,
    image2: null,
    image3: null,
    image4: null,
  });

  // Lấy danh mục & thương hiệu
  const fetchCategoriesAndBrands = async () => {
    try {
      setLoadingData(true);
      const [categoriesRes, brandsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/category`),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/brand`),
      ]);

      const categoriesData = await categoriesRes.json();
      const brandsData = await brandsRes.json();

      if (categoriesData.success) {
        setCategories(categoriesData.categories);
      }
      if (brandsData.success) {
        setBrands(brandsData.brands);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh mục và thương hiệu:", error);
      toast.error("Không thể tải danh mục và thương hiệu");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchCategoriesAndBrands();
  }, []);

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else if (
      type === "select-one" &&
      (name === "offer" || name === "isAvailable" || name === "badge")
    ) {
      setFormData({
        ...formData,
        [name]: value === "true",
      });
    } else if (
      name === "price" ||
      name === "discountedPercentage" ||
      name === "stock"
    ) {
      setFormData({
        ...formData,
        [name]: value === "" ? "" : Number(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Xử lý chọn hình ảnh
  const handleImageChange = (e, imageKey) => {
    const file = e.target.files[0];
    if (file) {
      setImageFiles((prev) => ({
        ...prev,
        [imageKey]: file,
      }));
    }
  };

  // Xóa hình ảnh
  const removeImage = (imageKey) => {
    setImageFiles((prev) => ({
      ...prev,
      [imageKey]: null,
    }));
  };

  // Gửi sản phẩm lên server
  const handleUploadProduct = async (e) => {
    e.preventDefault();

    // Kiểm tra dữ liệu
    if (
      !formData.name ||
      !formData.description ||
      !formData.price ||
      !formData.stock ||
      !formData.category
    ) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc");
      return;
    }

    const hasImage = Object.values(imageFiles).some((file) => file !== null);
    if (!hasImage) {
      toast.error("Vui lòng tải lên ít nhất một hình ảnh");
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();

      // Thêm dữ liệu vào form
      data.append("_type", formData._type);
      data.append("name", formData.name);
      data.append("description", formData.description);
      data.append("brand", formData.brand);
      data.append("price", formData.price);
      data.append("discountedPercentage", formData.discountedPercentage);
      data.append("stock", formData.stock);
      data.append("category", formData.category);
      data.append("offer", formData.offer);
      data.append("isAvailable", formData.isAvailable);
      data.append("badge", formData.badge);
      data.append("tags", JSON.stringify(formData.tags));

      // Thêm hình ảnh
      Object.keys(imageFiles).forEach((key) => {
        if (imageFiles[key]) {
          data.append(key, imageFiles[key]);
        }
      });

      const response = await axios.post(serverUrl + "/api/product/add", data, {
        headers: {
          token,
          "Content-Type": "multipart/form-data",
        },
      });

      const responseData = response?.data;
      if (responseData?.success) {
        toast.success(responseData?.message);
        navigate("/list");
      } else {
        toast.error(responseData?.message);
      }
    } catch (error) {
      console.log("Lỗi khi tải sản phẩm lên", error);
      toast.error(error?.response?.data?.message || "Lỗi khi tải sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
      <div className="xl:max-w-5xl bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Tiêu đề */}
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <IoMdAdd className="text-white text-xl" />
            </div>
            <div>
              <Title className="text-xl sm:text-2xl font-bold text-gray-800">
                Thêm Sản Phẩm Mới
              </Title>
              <p className="text-sm text-gray-500 mt-1">
                Tạo sản phẩm mới cho cửa hàng của bạn
              </p>
            </div>
          </div>

          <form className="space-y-6 sm:space-y-8" onSubmit={handleUploadProduct}>
            {/* Tải hình ảnh */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Hình ảnh sản phẩm
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {["image1", "image2", "image3", "image4"].map(
                  (imageKey, index) => (
                    <div key={imageKey} className="relative">
                      <label htmlFor={imageKey} className="block">
                        <div className="relative group cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors duration-200 min-h-[120px] flex flex-col items-center justify-center bg-white">
                          {imageFiles[imageKey] ? (
                            <>
                              <img
                                src={URL.createObjectURL(imageFiles[imageKey])}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-20 object-cover rounded-md mb-2"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  removeImage(imageKey);
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                              >
                                <FaTimes className="text-xs" />
                              </button>
                              <span className="text-xs text-gray-600">
                                Thay đổi
                              </span>
                            </>
                          ) : (
                            <>
                              <IoMdCloudUpload className="text-3xl text-gray-400 mb-2" />
                              <span className="text-xs text-gray-600">
                                Tải lên hình ảnh {index + 1}
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            id={imageKey}
                            hidden
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, imageKey)}
                          />
                        </div>
                      </label>
                    </div>
                  )
                )}
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Tải lên tối đa 4 hình ảnh. Hình đầu tiên sẽ là ảnh đại diện chính.
              </p>
            </div>

            {/* Thông tin cơ bản */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Thông tin cơ bản
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="lg:col-span-2">
                  <Label htmlFor="name">Tên sản phẩm *</Label>
                  <Input
                    type="text"
                    placeholder="Nhập tên sản phẩm"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1"
                    required
                  />
                </div>

                <div className="lg:col-span-2">
                  <Label htmlFor="description">Mô tả *</Label>
                  <textarea
                    placeholder="Nhập mô tả sản phẩm"
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="brand">Thương hiệu</Label>
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loadingData}
                  >
                    <option value="">
                      {loadingData ? "Đang tải thương hiệu..." : "Chọn thương hiệu"}
                    </option>
                    {brands.map((brand) => (
                      <option key={brand._id} value={brand.name}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="_type">Loại sản phẩm</Label>
                  <select
                    name="_type"
                    value={formData._type}
                    onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn loại</option>
                    <option value="new_arrivals">Hàng mới về</option>
                    <option value="best_sellers">Bán chạy</option>
                    <option value="special_offers">Ưu đãi đặc biệt</option>
                    <option value="promotions">Khuyến mãi</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Giá cả & tồn kho */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Giá cả & Hàng tồn kho
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="flex flex-col">
                  <Label htmlFor="price">Giá *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="mt-1"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <Label htmlFor="discountedPercentage">Tỷ lệ chiết khấu</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="10"
                    name="discountedPercentage"
                    value={formData.discountedPercentage}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div className="flex flex-col">
                  <Label htmlFor="stock">Số lượng tồn *</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    className="mt-1"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Danh mục & cài đặt */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Danh mục & Cài đặt
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div>
                  <Label htmlFor="category">Danh mục *</Label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={loadingData}
                  >
                    <option value="">
                      {loadingData ? "Đang tải danh mục..." : "Chọn danh mục"}
                    </option>
                    {categories.map((category) => (
                      <option key={category._id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="isAvailable">Tình trạng</Label>
                  <select
                    name="isAvailable"
                    value={formData.isAvailable.toString()}
                    onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="true">Còn hàng</option>
                    <option value="false">Hết hàng</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="offer">Ưu đãi đặc biệt</Label>
                  <select
                    name="offer"
                    value={formData.offer.toString()}
                    onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="false">Không</option>
                    <option value="true">Có</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="badge">Hiển thị huy hiệu</Label>
                  <select
                    name="badge"
                    value={formData.badge.toString()}
                    onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="false">Không</option>
                    <option value="true">Có</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Thẻ (tags) */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Thẻ (Tags)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {["Thời trang", "Điện tử", "Thể thao", "Phụ kiện", "Khác"].map(
                  (tag) => (
                    <div className="flex items-center space-x-2" key={tag}>
                      <input
                        id={tag.toLowerCase()}
                        type="checkbox"
                        name="tags"
                        value={tag}
                        checked={formData.tags.includes(tag)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData((prevData) => ({
                              ...prevData,
                              tags: [...prevData.tags, tag],
                            }));
                          } else {
                            setFormData((prevData) => ({
                              ...prevData,
                              tags: prevData.tags.filter((t) => t !== tag),
                            }));
                          }
                        }}
                      />
                      <label
                        htmlFor={tag.toLowerCase()}
                        className="text-sm text-gray-700 cursor-pointer"
                      >
                        {tag}
                      </label>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Nút gửi */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                disabled={isLoading}
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <SmallLoader />
                    <span>Đang thêm sản phẩm...</span>
                  </>
                ) : (
                  <>
                    <IoMdAdd className="text-lg" />
                    <span>Thêm sản phẩm</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

Add.propTypes = {
  token: PropTypes.string.isRequired,
};

export default Add;
