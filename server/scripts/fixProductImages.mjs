/**
 * Cập nhật URL ảnh sản phẩm bị 404 (Cloudinary demo giả / Unsplash hết hạn).
 * Chạy: node server/scripts/fixProductImages.mjs
 */
import dotenv from "dotenv";
import connectDB from "../config/mongodb.js";
import Product from "../models/productModel.js";

dotenv.config();

const WORKING_IMAGES = {
  shirt: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600",
  shoes: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600",
  sneaker: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=600",
  winter: "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=600",
  sample: "https://res.cloudinary.com/demo/image/upload/c_fill,w_600,h_600/sample.jpg",
  flowers: "https://res.cloudinary.com/demo/image/upload/c_fill,w_600,h_600/flowers",
  piechart: "https://res.cloudinary.com/demo/image/upload/c_fill,w_600,h_600/docs/piechart",
  demoShoes: "https://res.cloudinary.com/demo/image/upload/c_fill,w_600,h_600/docs/shoes.jpg",
};

const SLUG_IMAGE_MAP = {
  "ao-thun-cotton-co-ban": WORKING_IMAGES.shirt,
  "giay-the-thao-chay-bo": WORKING_IMAGES.shoes,
  "quan-jeans-slim-fit": WORKING_IMAGES.winter,
  "ao-khoac-len-dang-rong": WORKING_IMAGES.sample,
  "tui-deo-cheo-nho": WORKING_IMAGES.piechart,
  "quan-short-the-thao": WORKING_IMAGES.demoShoes,
  "ao-khoac-gio-nam": WORKING_IMAGES.sample,
  "quan-jogger-the-thao": WORKING_IMAGES.flowers,
  "giay-sneaker-casual": WORKING_IMAGES.sneaker,
  "mu-luoi-trai": WORKING_IMAGES.shirt,
  "ao-thun-the-thao-kho-nhanh": WORKING_IMAGES.shirt,
  "ao-len-co-lo": WORKING_IMAGES.winter,
};

const isBrokenUrl = (url) =>
  !url ||
  url.includes("cloudinary.com/demo/image/upload/v1371813695/") ||
  url.includes("photo-1541099649105") ||
  url.includes("photo-1529374255404") ||
  url.includes("photo-1585568009818") ||
  url.includes("photo-1589003077984") ||
  url.includes("photo-1575116677642") ||
  url.includes("photo-1578357628143");

await connectDB();

const products = await Product.find({});
let updated = 0;

for (const product of products) {
  const current = product.images?.[0];
  if (!isBrokenUrl(current)) continue;

  const slug = product.slug;
  const newUrl =
    (slug && SLUG_IMAGE_MAP[slug]) ||
    WORKING_IMAGES.sample;

  product.images = [newUrl, ...(product.images?.slice(1) || [])];
  await product.save();
  updated++;
  console.log(`✓ ${product.name} → ${newUrl}`);
}

console.log(`\nĐã cập nhật ${updated}/${products.length} sản phẩm.`);
process.exit(0);
