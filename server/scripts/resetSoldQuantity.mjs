/**
 * Reset soldQuantity của tất cả sản phẩm về 0
 * Chạy: node server/scripts/resetSoldQuantity.mjs
 */

import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env từ thư mục server
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, "../.env") });

import productModel from "../models/productModel.js";
import dbConnect from "../config/mongodb.js";

async function resetSoldQuantity() {
  try {
    await dbConnect();
    console.log("Đã kết nối MongoDB");

    const result = await productModel.updateMany(
      {},
      { $set: { soldQuantity: 0 } }
    );

    console.log(`✅ Đã reset soldQuantity: ${result.modifiedCount} sản phẩm → 0`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
}

resetSoldQuantity();
