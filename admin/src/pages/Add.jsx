import { useState, useEffect } from "react";

import PropTypes from "prop-types";

import Title from "../components/ui/title";

import { IoMdAdd, IoMdCloudUpload, IoMdPricetag, IoMdCube, IoMdListBox } from "react-icons/io";

import { FaTimes, FaTag, FaBox, FaDollarSign, FaBoxOpen } from "react-icons/fa";

import { MdDescription, MdCategory, MdLocalOffer, MdBadge, MdImage } from "react-icons/md";

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

    category: "",

    price: "",

    discountedPercentage: 10,

    tags: [],

    stock: 0,

    hasVariants: false,

    variants: [],

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

    } else if (name === "hasVariants") {

      setFormData({

        ...formData,

        [name]: value === "true",

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



  // Xử lý variants
  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { size: "", color: "", stock: 0 }],
    });
  };

  const removeVariant = (index) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index),
    });
  };

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index] = {
      ...updatedVariants[index],
      [field]: field === "stock" ? (value === "" ? 0 : Number(value)) : value,
    };
    setFormData({
      ...formData,
      variants: updatedVariants,
    });
  };



  // Gửi sản phẩm lên server

  const handleUploadProduct = async (e) => {

    e.preventDefault();



    // Kiểm tra dữ liệu

    if (

      !formData.name ||

      !formData.description ||

      !formData.price ||

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

      if (formData._type) {

        data.append("_type", formData._type);

      }

      data.append("name", formData.name);

      data.append("description", formData.description);

      data.append("brand", formData.brand);

      data.append("price", formData.price);

      data.append("discountedPercentage", formData.discountedPercentage);


      data.append("category", formData.category);

      data.append("stock", formData.stock);
      data.append("hasVariants", formData.hasVariants);
      data.append("variants", JSON.stringify(formData.variants));

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

      <div className="xl:max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200">

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

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 sm:p-6 border border-blue-100 shadow-sm">

              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MdImage className="text-blue-600" />
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

            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">

              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></span>
                Thông tin cơ bản
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

                <div className="relative flex flex-col">
                  <Label htmlFor="name">Tên sản phẩm *</Label>
                  <div className="relative mt-1">
                    <FaTag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input

                      type="text"

                      placeholder="Nhập tên sản phẩm"

                      name="name"

                      value={formData.name}

                      onChange={handleChange}

                      className="pl-10 h-10"

                      required

                    />
                  </div>
                </div>

                <div className="flex flex-col relative">
                  <Label htmlFor="price">Giá *</Label>
                  <div className="relative mt-1">
                    <FaDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input

                      type="number"

                      step="0.01"

                      min="0"

                      placeholder="0.00"

                      name="price"

                      value={formData.price}

                      onChange={handleChange}

                      className="pl-10 h-10"

                      required

                    />
                  </div>
                </div>

                <div className="flex flex-col relative">
                  <Label htmlFor="discountedPercentage">Tỷ lệ chiết khấu</Label>
                  <div className="relative mt-1">
                    <IoMdPricetag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input

                      type="number"

                      min="0"

                      max="100"

                      placeholder="10"

                      name="discountedPercentage"

                      value={formData.discountedPercentage}

                      onChange={handleChange}

                      className="pl-10 h-10"

                    />
                  </div>
                </div>

                <div className="relative flex flex-col">
                  <Label htmlFor="_type">Loại sản phẩm</Label>
                  <div className="relative mt-1">
                    <FaBox className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select

                      name="_type"

                      value={formData._type}

                      onChange={handleChange}

                      className="mt-1 w-full pl-10 pr-4 py-2 h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"

                    >

                      <option value="">Sản phẩm thường</option>

                      <option value="new_arrivals">Sản phẩm mới</option>

                      <option value="best_sellers">Sản phẩm bán chạy</option>

                    </select>
                  </div>
                </div>

                <div className="relative flex flex-col">
                  <Label htmlFor="brand">Thương hiệu</Label>
                  <div className="relative mt-1">
                    <FaBoxOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select

                      name="brand"

                      value={formData.brand}

                      onChange={handleChange}

                      className="mt-1 w-full pl-10 pr-4 py-2 h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"

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
                </div>

                <div className="relative flex flex-col">
                  <Label htmlFor="category">Danh mục *</Label>
                  <div className="relative mt-1">
                    <MdCategory className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select

                      name="category"

                      value={formData.category}

                      onChange={handleChange}

                      className="mt-1 w-full pl-10 pr-4 py-2 h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"

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
                </div>



                <div className="lg:col-span-3 relative flex flex-col">
                  <Label htmlFor="description">Mô tả *</Label>
                  <div className="relative mt-1">
                    <MdDescription className="absolute left-3 top-3 text-gray-400" />
                    <textarea

                      placeholder="Nhập mô tả sản phẩm"

                      className="mt-1 w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent resize-none"

                      rows={4}

                      name="description"

                      value={formData.description}

                      onChange={handleChange}

                      required

                    />
                  </div>
                </div>

              </div>

            </div>



            {/* Tồn kho & Variants */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></span>
                Tồn kho & Biến thể
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="hasVariants"
                    name="hasVariants"
                    checked={formData.hasVariants}
                    onChange={handleChange}
                    className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                  />
                  <label htmlFor="hasVariants" className="text-sm text-gray-700">
                    Sản phẩm có biến thể (size, màu)
                  </label>
                </div>

                {!formData.hasVariants && (
                  <div className="relative flex flex-col">
                    <Label htmlFor="stock">Tồn kho tổng *</Label>
                    <div className="relative mt-1">
                      <IoMdCube className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
                        className="pl-10 h-10"
                        required={!formData.hasVariants}
                      />
                    </div>
                  </div>
                )}

                {formData.hasVariants && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">Danh sách biến thể (size, màu, tồn kho)</p>
                      <button
                        type="button"
                        onClick={addVariant}
                        className="text-sm bg-black text-white px-3 py-1.5 rounded-md hover:bg-gray-800 transition-colors"
                      >
                        + Thêm biến thể
                      </button>
                    </div>
                    
                    {formData.variants.length === 0 && (
                      <p className="text-sm text-gray-500 italic">Chưa có biến thể nào. Nhấn "Thêm biến thể" để bắt đầu.</p>
                    )}
                    
                    {formData.variants.map((variant, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Size (S, M, L, XL...)"
                            value={variant.size}
                            onChange={(e) => handleVariantChange(index, "size", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Màu (Trắng, Đen...)"
                            value={variant.color}
                            onChange={(e) => handleVariantChange(index, "color", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                          />
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            min="0"
                            placeholder="Tồn kho"
                            value={variant.stock}
                            onChange={(e) => handleVariantChange(index, "stock", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>



            {/* Nút gửi */}

            <div className="flex justify-end pt-6 border-t border-gray-200">

              <button

                disabled={isLoading}

                type="submit"

                className="bg-black hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-8 rounded-xl transition-colors duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"

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

