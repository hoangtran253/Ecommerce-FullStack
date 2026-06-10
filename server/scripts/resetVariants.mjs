import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from server directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import connectDB from '../config/mongodb.js';
import Product from '../models/productModel.js';

await connectDB();

const resetVariants = async () => {
  try {
    console.log('🔄 Đang reset variants về trạng thái ban đầu...\n');
    
    // Danh sách các sản phẩm tôi đã thêm variants
    const productIds = [
      '6a181fe4397785b7d0acd188', // Áo thun cotton
      '6a181fe4397785b7d0acd18a', // Quần jeans
      '6a181fe4397785b7d0acd18b', // Áo da
      '6a181fe4397785b7d0acd18c', // Túi xách
      '6a181fe4397785b7d0acd18d', // Quần short
      '6a181fe4397785b7d0acd191', // Mũ lưỡi trai
      '6a181fe4397785b7d0acd193', // Áo len
    ];

    let resetCount = 0;

    for (const productId of productIds) {
      const product = await Product.findById(productId);
      
      if (!product) {
        console.log(`❌ Không tìm thấy sản phẩm với ID: ${productId}`);
        continue;
      }

      // Reset variants về trạng thái ban đầu
      product.variants = [];
      product.hasVariants = false;
      product.stock = product.quantity || 0;

      await product.save();
      console.log(`✅ Đã reset variants cho sản phẩm "${product.name}"`);
      resetCount++;
    }

    console.log(`\n🎉 Hoàn thành! Đã reset ${resetCount} sản phẩm.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
};

await resetVariants();
