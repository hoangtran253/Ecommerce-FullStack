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

const checkProducts = async () => {
  try {
    console.log('🔍 Đang kiểm tra tất cả sản phẩm...\n');
    
    const products = await Product.find({});
    console.log(`Tổng số sản phẩm: ${products.length}\n`);
    
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   ID: ${product._id}`);
      console.log(`   hasVariants: ${product.hasVariants}`);
      console.log(`   Số lượng variants: ${product.variants ? product.variants.length : 0}`);
      if (product.variants && product.variants.length > 0) {
        console.log(`   Variants:`);
        product.variants.forEach((v, i) => {
          console.log(`     ${i + 1}. Size: ${v.size}, Color: ${v.color}, Stock: ${v.stock}`);
        });
      }
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
};

await checkProducts();
