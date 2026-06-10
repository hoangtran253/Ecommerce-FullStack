import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Container from "../components/Container";
import ProductsSideNav from "../components/products/ProductsSideNav";
import PaginationProductList from "../components/products/PaginationProductList";
import { config } from "../../config";
import { getData } from "../helpers";
import { normalizeFilterText, formatVndInput } from "../utils/shopFilters";

const Shop = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "",
    brand: "",
    priceRange: "",
    search: "",
  });
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const endpoint = `${config?.baseUrl}/api/products`;

  // Đọc bộ lọc từ URL (?category= & ?brand=)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const categoryParam = searchParams.get("category") || "";
    const brandParam = searchParams.get("brand") || "";

    setFilters((prev) => ({
      ...prev,
      category: categoryParam,
      brand: brandParam,
    }));
  }, [location.search]);

  useEffect(() => {
    const getProducts = async () => {
      setLoading(true);
      try {
        const data = await getData(endpoint);
        setProducts(data?.products || []);
        setFilteredProducts(data?.products || []);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setLoading(false);
      }
    };
    getProducts();
  }, [endpoint]);

  // Filter and sort products
  useEffect(() => {
    let filtered = [...products];

    // Apply filters
    if (filters.category) {
      const cat = normalizeFilterText(filters.category);
      filtered = filtered.filter(
        (product) => normalizeFilterText(product.category) === cat
      );
    }

    if (filters.brand) {
      const br = normalizeFilterText(filters.brand);
      filtered = filtered.filter(
        (product) => normalizeFilterText(product.brand) === br
      );
    }

    if (filters.priceRange) {
      const [minRaw, maxRaw] = filters.priceRange.split("-");
      const min = Number(minRaw) || 0;
      const max = Number(maxRaw) || Infinity;
      filtered = filtered.filter((product) => {
        const price = Number(product.price) || 0;
        return price >= min && price <= max;
      });
    }

    if (filters.search) {
      filtered = filtered.filter(
        (product) =>
          product.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
          product.description
            ?.toLowerCase()
            .includes(filters.search.toLowerCase())
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
      default:
        // Keep original order (newest first from API)
        break;
    }

    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [products, filters, sortBy]);

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => {
      const next = { ...prev, ...newFilters };
      const params = new URLSearchParams();
      if (next.category) params.set("category", next.category);
      if (next.brand) params.set("brand", next.brand);
      const qs = params.toString();
      navigate(qs ? `/shop?${qs}` : "/shop", { replace: true });
      return next;
    });
    if (window.innerWidth < 1024) {
      setTimeout(() => setMobileFiltersOpen(false), 500);
    }
  };

  const clearFilters = () => {
    navigate("/shop", { replace: true });
    setFilters({
      category: "",
      brand: "",
      priceRange: "",
      search: "",
    });
    // Auto-close mobile filters when clearing (optional UX enhancement)
    if (window.innerWidth < 1024) {
      setTimeout(() => setMobileFiltersOpen(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <Container className="py-4">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Cửa hàng</h1>
            <nav className="flex text-sm text-gray-500">
              <a href="/" className="hover:text-gray-700 transition-colors">
                Trang chủ
              </a>
              <span className="mx-2">/</span>
              <span className="text-gray-900">Cửa hàng</span>
            </nav>
          </div>
        </Container>
      </div>

      <Container className="py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Filters */}
          <aside className="lg:w-1/4">
            <div className="sticky top-8 space-y-6">
              {/* Mobile Filter Toggle */}
              <div className="lg:hidden">
                <button
                  onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium">Bộ lọc</span>
                  <svg
                    className={`w-5 h-5 transform transition-transform duration-200 ${
                      mobileFiltersOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Mobile Filter Content */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    mobileFiltersOpen
                      ? "max-h-[2000px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="pt-4">
                    <ProductsSideNav
                      onFilterChange={handleFilterChange}
                      filters={filters}
                      onClearFilters={clearFilters}
                    />
                  </div>
                </div>
              </div>

              {/* Desktop Filter Sidebar */}
              <div className="hidden lg:block">
                <ProductsSideNav
                  onFilterChange={handleFilterChange}
                  filters={filters}
                  onClearFilters={clearFilters}
                />
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:w-3/4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredProducts.length
                  )}{" "}
                  trên {filteredProducts.length} kết quả
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Sort by */}
                <div className="flex items-center gap-2">
                  <label htmlFor="sortBy" className="text-sm text-gray-600">
                    Sắp xếp:
                  </label>
                  <select
                    id="sortBy"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="price-low">Giá: Thấp đến cao</option>
                    <option value="price-high">Giá: Cao đến thấp</option>
                    <option value="name">Tên: A → Z</option>
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 ${
                      viewMode === "grid"
                        ? "bg-gray-900 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    } transition-colors`}
                    aria-label="Grid view"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 4a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM9 4a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V4zM9 10a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2zM15 4a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V4zM15 10a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 ${
                      viewMode === "list"
                        ? "bg-gray-900 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    } transition-colors`}
                    aria-label="List view"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 4a1 1 0 000 2h14a1 1 0 100-2H3zM3 8a1 1 0 000 2h14a1 1 0 100-2H3zM3 12a1 1 0 100 2h14a1 1 0 100-2H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {(filters.category ||
              filters.brand ||
              filters.search ||
              filters.priceRange) && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-sm text-gray-600">Bộ lọc đang áp dụng:</span>
                {filters.category && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-900 text-white text-sm rounded-full">
                    Danh mục: {filters.category}
                    <button
                      onClick={() => handleFilterChange({ category: "" })}
                      className="ml-1 hover:text-gray-300"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.brand && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-900 text-white text-sm rounded-full">
                    Thương hiệu: {filters.brand}
                    <button
                      onClick={() => handleFilterChange({ brand: "" })}
                      className="ml-1 hover:text-gray-300"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.search && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-900 text-white text-sm rounded-full">
                    Tìm kiếm: {filters.search}
                    <button
                      onClick={() => handleFilterChange({ search: "" })}
                      className="ml-1 hover:text-gray-300"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.priceRange && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-900 text-white text-sm rounded-full">
                    Giá:{" "}
                    {(() => {
                      const [a, b] = filters.priceRange.split("-");
                      return `${formatVndInput(a)} – ${formatVndInput(b)} ₫`;
                    })()}
                    <button
                      onClick={() => handleFilterChange({ priceRange: "" })}
                      className="ml-1 hover:text-gray-300"
                    >
                      ×
                    </button>
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  Xóa tất cả
                </button>
              </div>
            )}

            {/* Products Grid/List */}
            <div className="min-h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <PaginationProductList
                  products={filteredProducts}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  viewMode={viewMode}
                />
              )}
            </div>
          </main>
        </div>
      </Container>
    </div>
  );
};

export default Shop;
