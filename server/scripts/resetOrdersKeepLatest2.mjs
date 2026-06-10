/**
 * Xóa toàn bộ đơn hàng cũ, chỉ giữ 2 đơn mới nhất (theo ngày đặt).
 * Reset soldQuantity sản phẩm về 0 (dashboard tính từ đơn đã thanh toán).
 *
 * Chạy: node server/scripts/resetOrdersKeepLatest2.mjs
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";

dotenv.config();

const KEEP_COUNT = 2;

const run = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ Thiếu MONGO_URI trong server/.env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("✅ Đã kết nối MongoDB\n");

  const allOrders = await orderModel.find({}).sort({ date: -1 }).lean();
  console.log(`📦 Tổng đơn hiện có: ${allOrders.length}`);

  if (allOrders.length <= KEEP_COUNT) {
    console.log(`ℹ️  Đã có ≤ ${KEEP_COUNT} đơn, không xóa thêm.`);
  } else {
    const keep = allOrders.slice(0, KEEP_COUNT);
    const keepIds = keep.map((o) => o._id);
    const deleteResult = await orderModel.deleteMany({
      _id: { $nin: keepIds },
    });

    console.log(`\n✅ Giữ lại ${KEEP_COUNT} đơn mới nhất:`);
    keep.forEach((o, i) => {
      const id = String(o._id).slice(-8).toUpperCase();
      const name =
        o.address?.firstName && o.address?.lastName
          ? `${o.address.firstName} ${o.address.lastName}`
          : o.address?.email || "—";
      console.log(
        `   ${i + 1}. #${id} · ${name} · ${new Date(o.date).toLocaleString("vi-VN")} · ${o.amount?.toLocaleString("vi-VN")} ₫`
      );
    });
    console.log(`\n🗑️  Đã xóa ${deleteResult.deletedCount} đơn cũ.`);
  }

  const productReset = await productModel.updateMany(
    {},
    { $set: { soldQuantity: 0 } }
  );
  console.log(
    `\n🔄 Reset soldQuantity: ${productReset.modifiedCount} sản phẩm → 0`
  );

  const remaining = await orderModel.countDocuments();
  console.log(`\n📊 Còn lại ${remaining} đơn trong DB.`);
  console.log("🎯 Xong. Khởi động lại server và làm mới trang admin.\n");

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("❌ Lỗi:", err.message);
  process.exit(1);
});
