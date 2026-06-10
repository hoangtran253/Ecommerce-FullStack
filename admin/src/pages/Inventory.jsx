import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import axios from "axios";
import { serverUrl } from "../../config";
import { FaBox, FaSearch, FaSync, FaEdit, FaPlus, FaMinus, FaTimes } from "react-icons/fa";
import Container from "../components/Container";
import Title from "../components/ui/title";
import SmallLoader from "../components/SmallLoader";

const COLORS = ["Đen", "Trắng", "Xanh", "Hồng"];
const SHOE_SIZES = ["37", "38", "39", "40", "41"];
const CLOTHING_SIZES = ["S", "M", "L", "XL"];

const COLOR_MAP = {
  "Đen": "#1f2937",
  "Trắng": "#ffffff",
  "Xanh": "#2563eb",
  "Hồng": "#ec4899",
};

const getCategorySizes = (category) => {
  const lowerCategory = category?.toLowerCase() || "";
  if (lowerCategory.includes("giày") || lowerCategory.includes("shoe")) {
    return SHOE_SIZES;
  }
  if (lowerCategory.includes("áo") || lowerCategory.includes("quần") || lowerCategory.includes("clothing")) {
    return CLOTHING_SIZES;
  }
  if (lowerCategory.includes("phụ kiện") || lowerCategory.includes("accessory")) {
    return [];
  }
  return [];
};

const Inventory = () => {
  const { token } = useSelector((state) => state.auth);
  const [inventory, setInventory] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [adjustingStock, setAdjustingStock] = useState(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${serverUrl}/api/product/inventory`, {
        headers: { token },
      });
      if (response.data.success) {
        setInventory(response.data.products);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const openVariantModal = (product) => {
    setSelectedProduct(product);
    setShowVariantModal(true);
  };

  const closeVariantModal = () => {
    setSelectedProduct(null);
    setShowVariantModal(false);
  };

  const adjustVariantStock = async (productId, variant, change) => {
    try {
      setAdjustingStock(`${productId}-${variant.size}-${variant.color}`);
      const response = await axios.post(
        `${serverUrl}/api/product/inventory/adjust`,
        { 
          productId, 
          change,
          size: variant.size,
          color: variant.color
        },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchInventory();
        // Update selectedProduct with new data
        const updatedInventory = await axios.get(`${serverUrl}/api/product/inventory`, {
          headers: { token },
        });
        if (updatedInventory.data.success) {
          const updatedProduct = updatedInventory.data.products.find(p => p._id === productId);
          if (updatedProduct) {
            setSelectedProduct(updatedProduct);
          }
        }
      }
    } catch (error) {
      console.error("Error adjusting stock:", error);
      toast.error(error.response?.data?.message || "Failed to adjust stock");
    } finally {
      setAdjustingStock(null);
    }
  };

  const setVariantStock = async (productId, variantIndex, newStock) => {
    try {
      setAdjustingStock(`${productId}-${variantIndex}`);
      const response = await axios.put(
        `${serverUrl}/api/product/inventory/${productId}/audit`,
        { actualStock: newStock },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        fetchInventory();
      }
    } catch (error) {
      console.error("Error setting stock:", error);
      toast.error(error.response?.data?.message || "Failed to set stock");
    } finally {
      setAdjustingStock(null);
    }
  };

  const sortVariants = (variants, category) => {
    const categorySizes = getCategorySizes(category);
    if (categorySizes.length === 0) {
      // For accessories, sort by color
      return [...variants].sort((a, b) => {
        const colorOrder = COLORS.indexOf(a.color) - COLORS.indexOf(b.color);
        return colorOrder;
      });
    }
    // For clothing and shoes, sort by size then color
    return [...variants].sort((a, b) => {
      const sizeA = categorySizes.indexOf(a.size);
      const sizeB = categorySizes.indexOf(b.size);
      if (sizeA !== -1 && sizeB !== -1 && sizeA !== sizeB) {
        return sizeA - sizeB;
      }
      // If same size, sort by color
      const colorA = COLORS.indexOf(a.color);
      const colorB = COLORS.indexOf(b.color);
      return colorA - colorB;
    });
  };

  const generateAllVariants = (category, existingVariants) => {
    const categorySizes = getCategorySizes(category);
    const allVariants = [];

    if (categorySizes.length === 0) {
      // Accessories: only colors
      COLORS.forEach((color) => {
        const existing = existingVariants.find(v => v.color === color);
        allVariants.push({
          size: null,
          color,
          stock: existing?.stock || 0,
          exists: !!existing
        });
      });
    } else {
      // Clothing and shoes: size x color combinations
      categorySizes.forEach((size) => {
        COLORS.forEach((color) => {
          const existing = existingVariants.find(v => v.size === size && v.color === color);
          allVariants.push({
            size,
            color,
            stock: existing?.stock || 0,
            exists: !!existing
          });
        });
      });
    }

    return allVariants;
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredInventory = inventory.filter((item) =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container>
      <div className="p-4">
        <Title>Kho Hàng</Title>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={fetchInventory}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <FaSync />
            Làm mới
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <SmallLoader />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SẢN PHẨM
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DANH MỤC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TỒN KHO
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ĐÃ BÁN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NGƯỠNG
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TRẠNG THÁI
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      THAO TÁC
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        <FaBox className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                        Không có sản phẩm nào
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((item) => (
                      <>
                        <tr key={item._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-16 w-16">
                                <img
                                  className="h-16 w-16 rounded-lg object-cover"
                                  src={item.image || "/placeholder.png"}
                                  alt={item.name}
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {item.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {item.brand || ""}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.stock}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.soldQuantity || 0}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.lowStockThreshold || 10}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                item.stock > (item.lowStockThreshold || 10)
                                  ? "bg-green-100 text-green-800"
                                  : item.stock > 0
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {item.stock > (item.lowStockThreshold || 10)
                                ? "Còn hàng"
                                : item.stock > 0
                                ? "Sắp hết"
                                : "Hết hàng"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => openVariantModal(item)}
                              className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-sm"
                            >
                              <FaEdit />
                              Chỉnh sửa
                            </button>
                          </td>
                        </tr>
                      </>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Variant Modal */}
      {showVariantModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Quản lý biến thể - {selectedProduct.name}
              </h3>
              <button
                onClick={closeVariantModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Danh mục: <span className="font-medium">{selectedProduct.category}</span>
                  {selectedProduct.brand && ` • Thương hiệu: ${selectedProduct.brand}`}
                </p>
              </div>
              
              {(() => {
                const categorySizes = getCategorySizes(selectedProduct.category);
                const shouldShowVariants = categorySizes.length > 0 || selectedProduct.hasVariants;
                
                if (!shouldShowVariants) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Sản phẩm này không có biến thể</p>
                      <p className="text-sm text-gray-400 mt-2">Tồn kho tổng: {selectedProduct.stock}</p>
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Size
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Màu sắc
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tồn kho
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {generateAllVariants(selectedProduct.category, selectedProduct.variants || []).map((variant, index, array) => {
                          const isLastInSizeGroup = index === array.length - 1 || variant.size !== array[index + 1].size;
                          return (
                            <tr key={index} className={`hover:bg-gray-50 ${isLastInSizeGroup ? 'border-b-2 border-gray-400' : ''}`}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {variant.size || "N/A"}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  {variant.color && (
                                    <div
                                      className="w-6 h-6 rounded-full border-2 border-gray-200"
                                      style={{ backgroundColor: COLOR_MAP[variant.color] || variant.color }}
                                      title={variant.color}
                                    />
                                  )}
                                  <span className="text-sm text-gray-900">{variant.color}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`text-sm font-medium ${
                                  variant.stock > 10 ? "text-green-600" : variant.stock > 0 ? "text-yellow-600" : "text-red-600"
                                }`}>
                                  {variant.stock || 0}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      min="0"
                                      defaultValue={0}
                                      placeholder="Nhập"
                                      className="w-14 px-2 py-1 border border-gray-300 rounded text-sm"
                                      id={`import-input-${selectedProduct._id}-${index}`}
                                    />
                                    <button
                                      onClick={() => {
                                        const input = document.getElementById(`import-input-${selectedProduct._id}-${index}`);
                                        const qty = parseInt(input?.value) || 0;
                                        if (qty > 0) {
                                          adjustVariantStock(selectedProduct._id, variant, qty);
                                          input.value = '';
                                        }
                                      }}
                                      disabled={adjustingStock === `${selectedProduct._id}-${variant.size}-${variant.color}`}
                                      className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
                                      title="Nhập hàng"
                                    >
                                      Nhập
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      min="0"
                                      defaultValue={0}
                                      placeholder="Xuất"
                                      className="w-14 px-2 py-1 border border-gray-300 rounded text-sm"
                                      id={`export-input-${selectedProduct._id}-${index}`}
                                    />
                                    <button
                                      onClick={() => {
                                        const input = document.getElementById(`export-input-${selectedProduct._id}-${index}`);
                                        const qty = parseInt(input?.value) || 0;
                                        if (qty > 0) {
                                          adjustVariantStock(selectedProduct._id, variant, -qty);
                                          input.value = '';
                                        }
                                      }}
                                      disabled={adjustingStock === `${selectedProduct._id}-${variant.size}-${variant.color}`}
                                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 disabled:opacity-50"
                                      title="Xuất hàng"
                                    >
                                      Xuất
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default Inventory;
