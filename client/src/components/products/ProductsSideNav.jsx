import { useState, useEffect } from "react";
import { config } from "../../../config";
import {
  fetchShopFilterOptions,
  buildPricePresets,
  formatVndInput,
} from "../../utils/shopFilters";

const ProductsSideNav = ({ onFilterChange, filters, onClearFilters }) => {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [priceBounds, setPriceBounds] = useState({ min: 0, max: 0 });
  const [pricePresets, setPricePresets] = useState([]);
  const [searchTerm, setSearchTerm] = useState(filters?.search || "");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { categories: cats, brands: brs, priceMin, priceMax } =
          await fetchShopFilterOptions(config?.baseUrl);
        setCategories(cats);
        setBrands(brs);
        setPriceBounds({ min: priceMin, max: priceMax });
        setPricePresets(buildPricePresets(priceMin, priceMax));
      } catch (error) {
        console.error("Error fetching filter options:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    setSearchTerm(filters?.search || "");
  }, [filters?.search]);

  useEffect(() => {
    if (!filters?.priceRange) {
      setPriceRange({ min: "", max: "" });
      return;
    }
    const [min, max] = filters.priceRange.split("-");
    setPriceRange({
      min: min !== undefined && min !== "" ? min : "",
      max: max !== undefined && max !== "" ? max : "",
    });
  }, [filters?.priceRange]);

  useEffect(() => {
    if (
      !filters?.category &&
      !filters?.brand &&
      !filters?.search &&
      !filters?.priceRange
    ) {
      setSearchTerm("");
      setPriceRange({ min: "", max: "" });
    }
  }, [filters]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onFilterChange({ search: value });
  };

  const handleCategoryChange = (category) => {
    onFilterChange({
      category: filters?.category === category ? "" : category,
    });
  };

  const handleBrandChange = (brand) => {
    onFilterChange({ brand: filters?.brand === brand ? "" : brand });
  };

  const handlePriceChange = (min, max) => {
    const minStr = min === "" || min === undefined ? "0" : String(min);
    const maxStr =
      max === "" || max === undefined
        ? String(priceBounds.max || 50000000)
        : String(max);
    setPriceRange({ min: minStr, max: maxStr });
    onFilterChange({ priceRange: `${minStr}-${maxStr}` });
  };

  const activePresetLabel = () => {
    if (!filters?.priceRange) return null;
    return pricePresets.find(
      (p) => filters.priceRange === `${p.min}-${p.max}`
    )?.label;
  };

  if (loading) {
    return (
      <div className="w-full space-y-4 text-sm text-gray-500 p-4">
        Đang tải bộ lọc...
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Tìm kiếm sản phẩm
        </h3>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Tên hoặc mô tả sản phẩm..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <svg
            className="absolute right-3 top-3.5 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Danh mục</h3>
        {categories.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa có danh mục</p>
        ) : (
          <div className="space-y-3">
            {categories.map((category) => (
              <label
                key={category}
                className="flex items-center cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={filters?.category === category}
                  onChange={() => handleCategoryChange(category)}
                  className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900 focus:ring-2"
                />
                <span className="ml-3 text-gray-700 group-hover:text-gray-900 transition-colors">
                  {category}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Thương hiệu
        </h3>
        {brands.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa có thương hiệu</p>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {brands.map((brand) => (
              <label
                key={brand}
                className="flex items-center cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={filters?.brand === brand}
                  onChange={() => handleBrandChange(brand)}
                  className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900 focus:ring-2"
                />
                <span className="ml-3 text-gray-700 group-hover:text-gray-900 transition-colors">
                  {brand}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Phạm vi giá (VNĐ)
        </h3>
        {priceBounds.max > 0 && (
          <p className="text-xs text-gray-500 mb-3">
            Giá shop: {formatVndInput(priceBounds.min)} –{" "}
            {formatVndInput(priceBounds.max)} ₫
          </p>
        )}
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">
                Giá tối thiểu
              </label>
              <input
                type="number"
                min={0}
                step={10000}
                value={priceRange.min}
                onChange={(e) =>
                  setPriceRange((prev) => ({ ...prev, min: e.target.value }))
                }
                placeholder={String(priceBounds.min || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">
                Giá tối đa
              </label>
              <input
                type="number"
                min={0}
                step={10000}
                value={priceRange.max}
                onChange={(e) =>
                  setPriceRange((prev) => ({ ...prev, max: e.target.value }))
                }
                placeholder={String(priceBounds.max || 5000000)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              handlePriceChange(priceRange.min, priceRange.max)
            }
            className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"
          >
            Áp dụng bộ lọc giá
          </button>
          {activePresetLabel() && (
            <p className="text-xs text-gray-600">
              Đang lọc: <span className="font-medium">{activePresetLabel()}</span>
            </p>
          )}
        </div>

        {pricePresets.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Bộ lọc nhanh:</h4>
            <div className="flex flex-wrap gap-2">
              {pricePresets.map((range) => (
                <button
                  key={range.label}
                  type="button"
                  onClick={() => handlePriceChange(range.min, range.max)}
                  className={`text-xs px-3 py-1 border rounded-full transition-colors ${
                    filters?.priceRange === `${range.min}-${range.max}`
                      ? "bg-gray-900 text-white border-gray-900"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <button
          type="button"
          onClick={onClearFilters}
          className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          Xóa tất cả bộ lọc
        </button>
      </div>
    </div>
  );
};

export default ProductsSideNav;
