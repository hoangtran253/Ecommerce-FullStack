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

const checkJordanRating = async () => {
  try {
    await connectDB();
    console.log('🔍 Đang kiểm tra Giày Jordan...\n');

    const jordan = await Product.findById('6a181fe4397785b7d0acd189');
    
    if (!jordan) {
      console.log('❌ Không tìm thấy Giày Jordan');
      process.exit(1);
    }

    console.log('📊 Thông tin sản phẩm:');
    console.log('- Rating trong database:', jordan.rating);
    console.log('- SoldQuantity:', jordan.soldQuantity);
    console.log('- Số lượng reviews:', jordan.numReviews || 0);
    
    const reviews = await Review.find({ productId: '6a181fe4397785b7d0acd189' });
    console.log('\n📝 Reviews thực tế trong database:');
    console.log('- Số lượng reviews:', reviews.length);
    
    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      console.log('- Rating trung bình từ reviews:', avgRating.toFixed(1));
      reviews.forEach((r, i) => {
        console.log(`  ${i + 1}. Rating: ${r.rating} sao, User: ${r.userId || 'Unknown'}`);
      });
      
      console.log('\n❌ Vấn đề: Rating trong database không khớp với trung bình từ reviews!');
      console.log(`   Database rating: ${jordan.rating}`);
      console.log(`   Tính từ reviews: ${avgRating.toFixed(1)}`);
    } else {
      console.log('\n⚠️  Không có review nào trong database');
      console.log(`   Nhưng rating trong database là: ${jordan.rating}`);
      console.log('   Nên được set về 0 nếu không có review');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
};

checkJordanRating();
