import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../redux/orebiSlice";
import Container from "../components/Container";
import { MdStar } from "react-icons/md";
import { motion } from "framer-motion";
import { getData } from "../helpers/index";
import { serverUrl } from "../config";
import toast from "react-hot-toast";
import PriceFormat from "../components/PriceFormat";
import UserAvatar from "../components/UserAvatar";

const COLORS = ["Đen", "Trắng", "Xanh", "Hồng"];
const SHOE_SIZES = ["37", "38", "39", "40", "41"];
const CLOTHING_SIZES = ["S", "M", "L", "XL"];

const getCategorySizes = (category) => {
  const lowerCategory = category?.toLowerCase() || "";
  if (lowerCategory.includes("giày") || lowerCategory.includes("shoe")) {
    return SHOE_SIZES;
  }
  if (lowerCategory.includes("áo") || lowerCategory.includes("quần") || lowerCategory.includes("clothing")) {
    return CLOTHING_SIZES;
  }
  if (lowerCategory.includes("phụ kiện") || lowerCategory.includes("accessory")) {
    return []; // Accessories don't need size selection
  }
  return [];
};

const getColorBadge = (color) => {
  const colorMap = {
    "Đen": { bg: "bg-gray-900", border: "border-2 border-gray-700" },
    "Trắng": { bg: "bg-white", border: "border-2 border-gray-300" },
    "Xanh": { bg: "bg-blue-600", border: "border-2 border-blue-400" },
    "Hồng": { bg: "bg-pink-500", border: "border-2 border-pink-300" },
  };
  const config = colorMap[color] || { bg: "bg-gray-200", border: "border-2 border-gray-300" };
  return (
    <span className={`inline-block w-6 h-6 rounded-full ${config.bg} ${config.border}`}></span>
  );
};

// eslint-disable-next-line react/prop-types
const StarPicker = ({ value, onChange, size = "w-8 h-8" }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        className="focus:outline-none"
        aria-label={`${star} sao`}
      >
        <MdStar
          className={`${size} ${
            star <= value ? "text-yellow-400" : "text-gray-300"
          } hover:text-yellow-400 transition-colors`}
        />
      </button>
    ))}
  </div>
);



const SingleProduct = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.orebiReducer?.userInfo);

  const [productInfo, setProductInfo] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState("description");
  const [quantity, setQuantity] = useState(1);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [soldCount, setSoldCount] = useState(0);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [myReview, setMyReview] = useState(null);
  const reviewOrderId = location.state?.orderId;
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  const loadReviews = useCallback(async (productId) => {
    const revData = await getData(`${serverUrl}/api/review/product/${productId}`);
    if (revData?.success) {
      setReviews(revData.reviews || []);
      setAverageRating(revData.averageRating || 0);
    }
  }, []);

  const loadSoldCount = useCallback(async (productId) => {
    try {
      const response = await fetch(`${serverUrl}/api/product/${productId}/sold-count`);
      const data = await response.json();
      if (data?.success) {
        setSoldCount(data.soldCount || 0);
      }
    } catch (error) {
      console.error("Error fetching sold count:", error);
    }
  }, []);

  const loadMyReview = useCallback(async (productId) => {
    if (!userInfo) return;
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${serverUrl}/api/review/mine/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data?.success) {
        setMyReview(data.review);
      }
    } catch (error) {
      console.error("Error fetching my review:", error);
    }
  }, [userInfo]);

  useEffect(() => {
    const loadProduct = async () => {
      setLoadingProduct(true);
      try {
        let product = location.state?.item;

        if (id) {
          const prodData = await getData(
            `${serverUrl}/api/product/list?_id=${id}`
          );
          if (prodData?.success && prodData.product) {
            product = prodData.product;
          }
        }

        if (product) {
          setProductInfo(product);
          await loadReviews(product._id);
          await loadSoldCount(product._id);
          await loadMyReview(product._id);
        }
      } catch (err) {
        console.error(err);
        toast.error("Không tải được sản phẩm");
      } finally {
        setLoadingProduct(false);
      }
    };

    loadProduct();
  }, [id, location.state?.item, loadReviews, loadSoldCount, loadMyReview]);

  useEffect(() => {
    if (location.state?.activeTab === "reviews") {
      setActiveTab("reviews");
    }
  }, [location.state?.activeTab]);

  useEffect(() => {
    if (activeTab !== "reviews" || !productInfo) return;
    const timer = setTimeout(() => {
      document
        .getElementById("product-reviews-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 350);
    return () => clearTimeout(timer);
  }, [activeTab, productInfo]);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (productInfo?.category) {
        setLoadingRelated(true);
        try {
          const response = await getData(
            `${serverUrl}/api/products?category=${encodeURIComponent(productInfo.category)}&_perPage=8`
          );
          if (response?.success && response?.products) {
            const filtered = response.products
              .filter((product) => product._id !== productInfo._id)
              .slice(0, 4);
            setRelatedProducts(filtered);
          }
        } catch (error) {
          console.error("Error fetching related products:", error);
        } finally {
          setLoadingRelated(false);
        }
      }
    };

    fetchRelatedProducts();
  }, [productInfo]);

  const productImages =
    productInfo?.images && productInfo.images.length > 0
      ? productInfo.images
      : [productInfo?.image].filter(Boolean);

  const handleQuantityChange = (type) => {
    if (type === "increment") {
      setQuantity((prev) => prev + 1);
    } else if (type === "decrement" && quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (!productInfo) return;

    const categorySizes = getCategorySizes(productInfo.category);
    const hasVariants = productInfo.hasVariants && productInfo.variants && productInfo.variants.length > 0;
    const isAccessory = categorySizes.length === 0 && hasVariants;

    // For accessories, only require color selection
    if (isAccessory) {
      if (!selectedColor) {
        toast.error("Vui lòng chọn màu sắc");
        return;
      }

      // Find variant with selected color (any size)
      const selectedVariant = productInfo.variants.find(
        (v) => v.color === selectedColor && v.stock > 0
      );

      if (!selectedVariant) {
        toast.error("Màu này đã hết hàng");
        return;
      }

      if (quantity > selectedVariant.stock) {
        toast.error(`Chỉ còn ${selectedVariant.stock} sản phẩm`);
        return;
      }

      dispatch(
        addToCart({
          ...productInfo,
          quantity,
          selectedSize: selectedVariant.size, // Use the variant's size (e.g., "Free size")
          selectedColor,
          variantStock: selectedVariant.stock,
        })
      );
      toast.success(`${productInfo.name} (${selectedColor}) đã được thêm vào giỏ hàng!`);
      return;
    }

    // For clothing and shoes, require both size and color selection
    if (hasVariants && categorySizes.length > 0) {
      if (!selectedSize || !selectedColor) {
        toast.error("Vui lòng chọn size và màu sắc");
        return;
      }

      const selectedVariant = productInfo.variants.find(
        (v) => v.size === selectedSize && v.color === selectedColor
      );

      if (!selectedVariant) {
        toast.error("Variant không tồn tại");
        return;
      }

      if (selectedVariant.stock <= 0) {
        toast.error("Sản phẩm đã hết hàng");
        return;
      }

      if (quantity > selectedVariant.stock) {
        toast.error(`Chỉ còn ${selectedVariant.stock} sản phẩm`);
        return;
      }

      dispatch(
        addToCart({
          ...productInfo,
          quantity,
          selectedSize,
          selectedColor,
          variantStock: selectedVariant.stock,
        })
      );
      toast.success(`${productInfo.name} (${selectedSize} - ${selectedColor}) đã được thêm vào giỏ hàng!`);
    } else {
      // For products without variants, add selected size/color if chosen, otherwise add without
      if (productInfo.stock <= 0) {
        toast.error("Sản phẩm đã hết hàng");
        return;
      }

      if (quantity > productInfo.stock) {
        toast.error(`Chỉ còn ${productInfo.stock} sản phẩm`);
        return;
      }

      const cartItem = {
        ...productInfo,
        quantity,
      };

      // Add size and color if selected (for UI purposes, even without database variants)
      if (selectedSize) cartItem.selectedSize = selectedSize;
      if (selectedColor) cartItem.selectedColor = selectedColor;

      dispatch(addToCart(cartItem));
      
      const sizeColorText = selectedSize && selectedColor 
        ? ` (${selectedSize} - ${selectedColor})` 
        : '';
      toast.success(`${productInfo.name}${sizeColorText} đã được thêm vào giỏ hàng!`);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    console.log("handleSubmitReview called");
    if (!userInfo) {
      toast.error("Vui lòng đăng nhập để đánh giá");
      navigate("/signin");
      return;
    }

    setSubmittingReview(true);
    try {
      const token = localStorage.getItem("token");
      console.log("Review form:", reviewForm);
      console.log("Product ID:", productInfo._id);
      console.log("Order ID:", reviewOrderId);

      // If editing, use update endpoint
      if (editingReviewId) {
        const res = await fetch(`${serverUrl}/api/review/user/${editingReviewId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating: reviewForm.rating,
            comment: reviewForm.comment.trim(),
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success(data.message);
          setReviewForm({ rating: 5, comment: "" });
          setEditingReviewId(null);
          loadReviews(productInfo._id);
          loadMyReview(productInfo._id);
        } else {
          toast.error(data.message);
        }
      } else {
        // Create new review
        console.log("Creating review to:", `${serverUrl}/api/review`);
        const res = await fetch(`${serverUrl}/api/review`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: productInfo._id,
            orderId: reviewOrderId || undefined,
            rating: reviewForm.rating,
            comment: reviewForm.comment.trim(),
          }),
        });
        console.log("Review response status:", res.status);
        const data = await res.json();
        console.log("Review response data:", data);
        if (data.success) {
          toast.success(data.message);
          setReviewForm({ rating: 5, comment: "" });
          loadReviews(productInfo._id);
          loadMyReview(productInfo._id);
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      console.log("Review submission error:", error);
      toast.error("Không thể gửi đánh giá");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleEditReview = (review) => {
    setReviewForm({ rating: review.rating, comment: review.comment });
    setEditingReviewId(review._id);
    setActiveTab("reviews");
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm("Bạn có chắc muốn xóa đánh giá này?")) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${serverUrl}/api/review/user/${reviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        loadReviews(productInfo._id);
        loadMyReview(productInfo._id);
        if (editingReviewId === reviewId) {
          setReviewForm({ rating: 5, comment: "" });
          setEditingReviewId(null);
        }
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Không thể xóa đánh giá");
    }
  };

  if (loadingProduct || !productInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <Container className="py-8">
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <span
            className="hover:text-gray-700 cursor-pointer"
            onClick={() => navigate("/")}
          >
            Trang chủ
          </span>
          <span>/</span>
          <span className="hover:text-gray-700 cursor-pointer capitalize">
            {productInfo?.category}
          </span>
          <span>/</span>
          <span className="text-gray-900 font-medium">{productInfo?.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div
              className="aspect-square overflow-hidden bg-gray-50 rounded-lg cursor-zoom-in relative group"
              onClick={() => setIsImageZoomed(!isImageZoomed)}
            >
              <img
                src={productImages[selectedImage] || "/placeholder-image.jpg"}
                alt={productInfo?.name}
                className={`w-full h-full object-cover transition-all duration-500 ${
                  isImageZoomed
                    ? "scale-150 cursor-zoom-out"
                    : "hover:scale-105 group-hover:scale-105"
                }`}
                onError={(e) => {
                  e.target.src = "/placeholder-image.jpg";
                }}
              />
            </div>

            <div className="grid grid-cols-4 gap-3">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square overflow-hidden bg-gray-50 rounded-lg border-2 transition-all ${
                    selectedImage === index
                      ? "border-black"
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <img
                    src={image || "/placeholder-image.jpg"}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <h1 className="text-3xl md:text-4xl font-light text-gray-900 leading-tight">
              {productInfo?.name}
            </h1>

            <div className="flex items-center gap-4">
              {productInfo?.oldPrice && (
                <span className="text-2xl text-gray-400 line-through">
                  <PriceFormat amount={productInfo.oldPrice} />
                </span>
              )}
              <span className="text-3xl font-light text-gray-900">
                <PriceFormat amount={productInfo?.price} />
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, index) => (
                  <MdStar
                    key={index}
                    className={`w-5 h-5 ${
                      index < Math.floor(averageRating)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {averageRating.toFixed(1)} / 5 · {reviews.length} đánh giá
              </span>
            </div>

            <div className="space-y-4">
              {/* Size and Color Selection */}
              {(() => {
                const categorySizes = getCategorySizes(productInfo?.category);
                const hasVariants = productInfo?.hasVariants && productInfo?.variants && productInfo?.variants.length > 0;
                const isAccessory = categorySizes.length === 0 && hasVariants;

                // Show size/color selection for clothing and shoes
                if (categorySizes.length > 0) {
                  return (
                    <>
                      {/* Size Selection */}
                      <div>
                        <label className="text-sm font-medium text-gray-900 mb-2 block">
                          Size:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {categorySizes.map((size) => {
                            const isAvailable = hasVariants
                              ? productInfo.variants.some(
                                  (v) => v.size === size && v.stock > 0
                                )
                              : false; // If no variants, disable all sizes
                            return (
                              <button
                                key={size}
                                type="button"
                                onClick={() => setSelectedSize(size)}
                                disabled={!isAvailable}
                                className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                                  selectedSize === size
                                    ? "border-black bg-black text-white"
                                    : isAvailable
                                    ? "border-gray-300 hover:border-gray-900 text-gray-900"
                                    : "border-gray-200 text-gray-400 cursor-not-allowed"
                                }`}
                              >
                                {size}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Color Selection */}
                      <div>
                        <label className="text-sm font-medium text-gray-900 mb-2 block">
                          Màu sắc:
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {COLORS.map((color) => {
                            const isAvailable = hasVariants
                              ? selectedSize
                                ? productInfo.variants.some(
                                    (v) => v.size === selectedSize && v.color === color && v.stock > 0
                                  )
                                : productInfo.variants.some(
                                    (v) => v.color === color && v.stock > 0
                                  )
                              : false; // If no variants, disable all colors
                            return (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setSelectedColor(color)}
                                disabled={!isAvailable}
                                className={`relative p-1 rounded-full transition-all ${
                                  selectedColor === color
                                    ? "ring-2 ring-offset-2 ring-black"
                                    : isAvailable
                                    ? "hover:ring-2 hover:ring-offset-2 hover:ring-gray-300"
                                    : "opacity-40 cursor-not-allowed"
                                }`}
                              >
                                {getColorBadge(color)}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Stock Information */}
                      {hasVariants && selectedSize && selectedColor && (() => {
                        const selectedVariant = productInfo.variants.find(
                          (v) => v.size === selectedSize && v.color === selectedColor
                        );
                        if (selectedVariant) {
                          return (
                            <p className="text-sm text-gray-600">
                              Tồn kho: <span className="font-medium">{selectedVariant.stock}</span>
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </>
                  );
                }

                // For accessories, only show color selection
                if (isAccessory) {
                  return (
                    <>
                      {/* Color Selection */}
                      <div>
                        <label className="text-sm font-medium text-gray-900 mb-2 block">
                          Màu sắc:
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {COLORS.map((color) => {
                            const isAvailable = hasVariants
                              ? productInfo.variants.some(
                                  (v) => v.color === color && v.stock > 0
                                )
                              : false;
                            return (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setSelectedColor(color)}
                                disabled={!isAvailable}
                                className={`relative p-1 rounded-full transition-all ${
                                  selectedColor === color
                                    ? "ring-2 ring-offset-2 ring-black"
                                    : isAvailable
                                    ? "hover:ring-2 hover:ring-offset-2 hover:ring-gray-300"
                                    : "opacity-40 cursor-not-allowed"
                                }`}
                              >
                                {getColorBadge(color)}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Stock Information */}
                      {hasVariants && selectedColor && (() => {
                        const selectedVariant = productInfo.variants.find(
                          (v) => v.color === selectedColor && v.stock > 0
                        );
                        if (selectedVariant) {
                          return (
                            <p className="text-sm text-gray-600">
                              Tồn kho: <span className="font-medium">{selectedVariant.stock}</span>
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </>
                  );
                }
                return null;
              })()}

              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-900">
                  Số lượng:
                </label>
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange("decrement")}
                    className="px-3 py-2 text-gray-600 hover:text-gray-900"
                  >
                    −
                  </button>
                  <span className="px-4 py-2 border-x border-gray-300 min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange("increment")}
                    className="px-3 py-2 text-gray-600 hover:text-gray-900"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={(() => {
                  const hasVariants = productInfo?.hasVariants && productInfo?.variants && productInfo?.variants.length > 0;
                  const categorySizes = getCategorySizes(productInfo?.category);
                  const isAccessory = categorySizes.length === 0 && hasVariants;
                  
                  if (isAccessory) {
                    // For accessories, only check color selection
                    if (selectedColor) {
                      const selectedVariant = productInfo.variants.find(
                        (v) => v.color === selectedColor && v.stock > 0
                      );
                      return !selectedVariant || selectedVariant.stock <= 0;
                    }
                    return false; // Allow click to show error message
                  }
                  
                  if (hasVariants && categorySizes.length > 0) {
                    // For products with variants, check if selected variant has stock
                    if (selectedSize && selectedColor) {
                      const selectedVariant = productInfo.variants.find(
                        (v) => v.size === selectedSize && v.color === selectedColor
                      );
                      return !selectedVariant || selectedVariant.stock <= 0;
                    }
                    return false; // Allow click to show error message
                  } else {
                    // For products without variants, check general stock
                    return productInfo?.stock <= 0;
                  }
                })()}
                className={`w-full py-4 px-8 rounded-md font-medium uppercase tracking-wider transition-all ${
                  (() => {
                    const hasVariants = productInfo?.hasVariants && productInfo?.variants && productInfo?.variants.length > 0;
                    const categorySizes = getCategorySizes(productInfo?.category);
                    const isAccessory = categorySizes.length === 0 && hasVariants;
                    
                    if (isAccessory) {
                      // For accessories, only check color selection
                      if (selectedColor) {
                        const selectedVariant = productInfo.variants.find(
                          (v) => v.color === selectedColor && v.stock > 0
                        );
                        return !selectedVariant || selectedVariant.stock <= 0
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-black text-white hover:bg-gray-800";
                      }
                      return "bg-black text-white hover:bg-gray-800";
                    }
                    
                    if (hasVariants && categorySizes.length > 0) {
                      if (selectedSize && selectedColor) {
                        const selectedVariant = productInfo.variants.find(
                          (v) => v.size === selectedSize && v.color === selectedColor
                        );
                        return !selectedVariant || selectedVariant.stock <= 0
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-black text-white hover:bg-gray-800";
                      }
                      return "bg-black text-white hover:bg-gray-800";
                    } else {
                      return productInfo?.stock <= 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-black text-white hover:bg-gray-800";
                    }
                  })()
                }`}
              >
                {(() => {
                  const hasVariants = productInfo?.hasVariants && productInfo?.variants && productInfo?.variants.length > 0;
                  const categorySizes = getCategorySizes(productInfo?.category);
                  const isAccessory = categorySizes.length === 0 && hasVariants;
                  
                  if (isAccessory) {
                    // For accessories, only check color selection
                    if (selectedColor) {
                      const selectedVariant = productInfo.variants.find(
                        (v) => v.color === selectedColor && v.stock > 0
                      );
                      return (!selectedVariant || selectedVariant.stock <= 0) ? "Hết hàng" : "Thêm vào giỏ";
                    }
                    return "Thêm vào giỏ";
                  }
                  
                  if (hasVariants && categorySizes.length > 0) {
                    if (selectedSize && selectedColor) {
                      const selectedVariant = productInfo.variants.find(
                        (v) => v.size === selectedSize && v.color === selectedColor
                      );
                      return (!selectedVariant || selectedVariant.stock <= 0) ? "Hết hàng" : "Thêm vào giỏ";
                    }
                    return "Thêm vào giỏ";
                  } else {
                    return productInfo?.stock <= 0 ? "Hết hàng" : "Thêm vào giỏ";
                  }
                })()}
              </button>
            </div>

            <div className="space-y-2 pt-4 border-t border-gray-200 text-sm">
              <p>
                <span className="font-medium">Đã bán:</span>{" "}
                <span className="text-gray-600">
                  {soldCount}
                </span>
              </p>
              {productInfo?._type && (
                <p>
                  <span className="font-medium">Loại sản phẩm:</span>{" "}
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize ml-2">
                    {productInfo._type === "new_arrivals" ? "Hàng mới ra mắt" : productInfo._type === "best_sellers" ? "Hàng bán chạy" : productInfo._type}
                  </span>
                </p>
              )}
              <p>
                <span className="font-medium">Mã SP:</span>{" "}
                <span className="text-gray-600">
                  {String(productInfo?._id || "").slice(-6).toUpperCase()}
                </span>
              </p>
              <p>
                <span className="font-medium">Danh mục:</span>{" "}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                  {productInfo?.category || "—"}
                </span>
              </p>
              <p>
                <span className="font-medium">Hãng:</span>{" "}
                <span className="text-gray-600">
                  {productInfo?.brand || "—"}
                </span>
              </p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="border-t border-gray-200 pt-12"
        >
          <div className="flex space-x-8 mb-8 border-b border-gray-200">
            {["description", "reviews"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-medium uppercase tracking-wider ${
                  activeTab === tab
                    ? "text-black border-b-2 border-black"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "reviews"
                  ? `Đánh giá (${reviews.length})`
                  : "Mô tả"}
              </button>
            ))}
          </div>

          <div className="min-h-[200px]">
            {activeTab === "description" && (
              <div className="space-y-12">
                <div className="flex items-center gap-3 pb-6 border-b-2 border-gray-200">
                  <div className="h-8 w-1 bg-black"></div>
                  <h3 className="text-3xl font-light text-gray-900">Mô tả sản phẩm</h3>
                </div>
                <div className="space-y-10">
                  {productInfo?.description ? (
                    <>
                      {productInfo.description.split('\n\n').map((paragraph, idx) => {
                        const firstLine = paragraph.split('\n')[0]?.trim();
                        const isSection = firstLine && (firstLine.length < 50 && !firstLine.startsWith('•'));
                        
                        return (
                          <div key={idx}>
                            {isSection && paragraph.split('\n').length > 1 ? (
                              // Section with header
                              <>
                                <div className="flex items-center gap-3 mb-6">
                                  <div className="h-8 w-1 bg-gradient-to-b from-black to-gray-400"></div>
                                  <h4 className="text-xl font-semibold text-gray-900">
                                    {firstLine}
                                  </h4>
                                </div>
                                <div className="space-y-3 pl-4">
                                  {paragraph.split('\n').slice(1).map((line, lineIdx) => {
                                    if (line.trim().startsWith('•')) {
                                      return (
                                        <div key={lineIdx} className="flex gap-4 items-start group">
                                          <div className="flex-shrink-0 mt-1.5">
                                            <div className="w-2 h-2 rounded-full bg-gray-400 group-hover:bg-black transition-colors"></div>
                                          </div>
                                          <p className="text-gray-700 leading-relaxed text-base text-justify">
                                            {line.trim().substring(1).trim()}
                                          </p>
                                        </div>
                                      );
                                    }
                                    if (line.trim()) {
                                      return (
                                        <p key={lineIdx} className="text-gray-700 leading-relaxed text-base">
                                          {line.trim()}
                                        </p>
                                      );
                                    }
                                    return null;
                                  })}
                                </div>
                              </>
                            ) : (
                              // Regular paragraph
                              <div className="space-y-3">
                                {paragraph.split('\n').map((line, lineIdx) => {
                                  if (line.trim().startsWith('•')) {
                                    return (
                                      <div key={lineIdx} className="flex gap-4 items-start group">
                                        <div className="flex-shrink-0 mt-1.5">
                                          <div className="w-2 h-2 rounded-full bg-gray-400 group-hover:bg-black transition-colors"></div>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed text-base text-justify">
                                          {line.trim().substring(1).trim()}
                                        </p>
                                      </div>
                                    );
                                  }
                                  if (line.trim()) {
                                    return (
                                      <p key={lineIdx} className="text-gray-700 leading-relaxed text-base text-justify">
                                        {line.trim()}
                                      </p>
                                    );
                                  }
                                  return null;
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                      <p className="text-gray-600 text-lg">Chưa có mô tả sản phẩm</p>
                      <p className="text-gray-500 text-sm mt-2">Vui lòng liên hệ admin để cập nhật thông tin</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div id="product-reviews-section" className="space-y-8 scroll-mt-24">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h3 className="text-lg font-medium mb-2">Viết đánh giá</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Chỉ khách đã thanh toán và nhận hàng mới được đánh giá. Bạn
                    cũng có thể đánh giá từ trang{" "}
                    <button
                      type="button"
                      className="text-black underline font-medium"
                      onClick={() => navigate("/orders")}
                    >
                      Đơn hàng của tôi
                    </button>
                    .
                  </p>
                  {userInfo ? (
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          {editingReviewId ? "Chỉnh sửa đánh giá" : "Chọn số sao"}
                        </p>
                        <StarPicker
                          value={reviewForm.rating}
                          onChange={(r) =>
                            setReviewForm((f) => ({ ...f, rating: r }))
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">
                          Nhận xét của bạn
                        </label>
                        <textarea
                          rows={4}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm"
                          placeholder="Chia sẻ trải nghiệm về sản phẩm..."
                          value={reviewForm.comment}
                          onChange={(e) =>
                            setReviewForm((f) => ({
                              ...f,
                              comment: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="px-6 py-2 bg-black text-white rounded-md text-sm font-medium disabled:opacity-50"
                        >
                          {submittingReview ? "Đang gửi..." : editingReviewId ? "Cập nhật" : "Gửi đánh giá"}
                        </button>
                        {editingReviewId && (
                          <button
                            type="button"
                            onClick={() => {
                              setReviewForm({ rating: 5, comment: "" });
                              setEditingReviewId(null);
                            }}
                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300"
                          >
                            Hủy
                          </button>
                        )}
                      </div>
                    </form>
                  ) : (
                    <p className="text-gray-600 text-sm">
                      <button
                        type="button"
                        className="text-black underline font-medium"
                        onClick={() => navigate("/signin")}
                      >
                        Đăng nhập
                      </button>{" "}
                      để đánh giá sản phẩm này.
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl font-light mb-6">
                    Đánh giá của khách hàng
                  </h3>
                  {reviews.length > 0 ? (
                    <div className="space-y-6">
                    {reviews.map((review) => (
                      <div
                        key={review._id}
                        className="border-b border-gray-200 pb-6 last:border-b-0"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <UserAvatar
                            src={review.reviewerAvatar}
                            name={review.reviewerName}
                            size={40}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900">
                                {review.reviewerName}
                              </h4>
                              {myReview?._id === review._id && (
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEditReview(review)}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                  >
                                    Chỉnh sửa
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteReview(review._id)}
                                    className="text-xs text-red-600 hover:text-red-800"
                                  >
                                    Xóa
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <MdStar
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? "text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(review.createdAt).toLocaleDateString(
                                "vi-VN"
                              )}
                            </p>
                          </div>
                        </div>
                        <p className="text-gray-600 leading-relaxed pl-[52px]">
                          {review.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                    <p className="text-gray-500">
                      Chưa có đánh giá. Hãy là người đầu tiên!
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="border-t border-gray-200 pt-16 mt-16"
        >
          <h2 className="text-2xl font-light text-center mb-12">
            Sản phẩm tương tự
          </h2>
          {loadingRelated ? (
            <p className="text-center text-gray-500">Đang tải...</p>
          ) : relatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((product) => (
                <div
                  key={product._id}
                  className="group cursor-pointer"
                  onClick={() =>
                    navigate(`/product/${product._id}`, {
                      state: { item: product },
                    })
                  }
                >
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                    <img
                      src={
                        product.image ||
                        product.images?.[0] ||
                        "/placeholder-image.jpg"
                      }
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="font-medium text-gray-900 truncate">
                    {product.name}
                  </h3>
                  <span className="text-lg font-light">
                    <PriceFormat amount={product.price} />
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">
              Không tìm thấy sản phẩm tương tự.
            </p>
          )}
        </motion.div>
      </Container>
    </div>
  );
};

export default SingleProduct;
