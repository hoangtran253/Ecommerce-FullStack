import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from server directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import connectDB from '../config/mongodb.js';
import Product from '../models/productModel.js';
import Review from '../models/reviewModel.js';

const recalculateRatings = async () => {
  try {
    await connectDB();
    console.log('🔄 Đang tính toán lại rating cho tất cả sản phẩm...\n');

    const products = await Product.find({});
    let updatedCount = 0;

    for (const product of products) {
      const reviews = await Review.find({ productId: product._id });
      
      let newRating = 0;
      let numReviews = reviews.length;
      
      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        newRating = totalRating / reviews.length;
      }
      
      // Chỉ cập nhật nếu rating thay đổi
      if (product.rating !== newRating || (product.numReviews || 0) !== numReviews) {
        product.rating = parseFloat(newRating.toFixed(1));
        product.numReviews = numReviews;
        await product.save();
        
        console.log(`✅ ${product.name}: ${product.rating} sao (${numReviews} reviews)`);
        updatedCount++;
      } else {
        console.log(`⏭️  ${product.name}: Không thay đổi (${product.rating} sao, ${numReviews} reviews)`);
      }
    }

    console.log(`\n🎉 Hoàn thành! Đã cập nhật ${updatedCount} sản phẩm.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
};

recalculateRatings();
