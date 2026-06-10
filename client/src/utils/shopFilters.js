import { getData } from "../helpers";

const sortVi = (arr) =>
  [...arr].sort((a, b) => String(a).localeCompare(String(b), "vi"));

/** Lấy danh mục, thương hiệu và khoảng giá từ sản phẩm + API danh mục/hãng */
export async function fetchShopFilterOptions(baseUrl) {
  const [productsRes, categoriesRes, brandsRes] = await Promise.all([
    getData(`${baseUrl}/api/products`).catch(() => ({ products: [] })),
    getData(`${baseUrl}/api/category`).catch(() => ({ categories: [] })),
    getData(`${baseUrl}/api/brand`).catch(() => ({ brands: [] })),
  ]);

  const products = productsRes?.products || [];

  const fromProducts = {
    categories: sortVi(
      [...new Set(products.map((p) => p.category).filter(Boolean))]
    ),
    brands: sortVi([...new Set(products.map((p) => p.brand).filter(Boolean))]),
  };

  const apiCategories = (categoriesRes?.categories || [])
    .map((c) => c.name)
    .filter(Boolean);
  const apiBrands = (brandsRes?.brands || [])
    .map((b) => b.name)
    .filter(Boolean);

  const categories = sortVi(
    [...new Set([...apiCategories, ...fromProducts.categories])]
  );
  const brands = sortVi([...new Set([...apiBrands, ...fromProducts.brands])]);

  const prices = products
    .map((p) => Number(p.price))
    .filter((n) => Number.isFinite(n) && n > 0);

  const priceMin = prices.length ? Math.min(...prices) : 0;
  const priceMax = prices.length ? Math.max(...prices) : 0;

  return { categories, brands, priceMin, priceMax, products };
}

export const formatVndInput = (n) =>
  Number(n || 0).toLocaleString("vi-VN", { maximumFractionDigits: 0 });

/** Bộ lọc giá nhanh (VND) — căn theo giá SP trong shop */
export const buildPricePresets = (priceMin, priceMax) => {
  const presets = [
    { label: "Dưới 500.000 ₫", min: 0, max: 500000 },
    { label: "500.000 – 1.000.000 ₫", min: 500000, max: 1000000 },
    { label: "1.000.000 – 2.000.000 ₫", min: 1000000, max: 2000000 },
    { label: "Trên 2.000.000 ₫", min: 2000000, max: 50000000 },
  ];

  if (priceMax > 0 && priceMax < 500000) {
    return [
      {
        label: `Dưới ${formatVndInput(priceMax)} ₫`,
        min: 0,
        max: priceMax,
      },
    ];
  }

  return presets.filter((p) => p.min <= priceMax && p.max >= priceMin);
};

export const normalizeFilterText = (s) => (s || "").trim().toLowerCase();

export const shopCategoryLink = (category) =>
  `/shop?category=${encodeURIComponent(category)}`;

export const shopBrandLink = (brand) =>
  `/shop?brand=${encodeURIComponent(brand)}`;
