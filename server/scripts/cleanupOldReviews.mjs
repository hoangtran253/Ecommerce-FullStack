/**
 * Xóa tất cả review cũ không có orderId
 * Chạy: node server/scripts/cleanupOldReviews.mjs
 */

import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env từ thư mục server
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, "../.env") });

import reviewModel from "../models/reviewModel.js";
import dbConnect from "../config/mongodb.js";

async function cleanupOldReviews() {
  try {
    await dbConnect();
    console.log("Đã kết nối MongoDB");

    // Đếm số review cũ không có orderId
    const oldReviewsCount = await reviewModel.countDocuments({ orderId: null });
    console.log(`Số review cũ không có orderId: ${oldReviewsCount}`);

    if (oldReviewsCount > 0) {
      // Xóa tất cả review cũ không có orderId
      const result = await reviewModel.deleteMany({ orderId: null });
      console.log(`✅ Đã xóa ${result.deletedCount} review cũ`);
    } else {
      console.log("Không có review cũ nào cần xóa");
    }

    // Hiển thị số review còn lại
    const remainingReviews = await reviewModel.countDocuments();
    console.log(`Số review còn lại: ${remainingReviews}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
}

cleanupOldReviews();
