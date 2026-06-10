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

const addVariants = async () => {
  try {
    console.log('🔧 Đang thêm variants cho sản phẩm...\n');
    
    // Danh sách sản phẩm cần thêm variants với cấu trúc tương tự như sản phẩm mẫu
    const productsToUpdate = [
      {
        productId: '6a181fe4397785b7d0acd188', // Áo thun cotton
        variants: [
          { size: 'S', color: 'Đen', stock: 10 },
          { size: 'M', color: 'Đen', stock: 15 },
          { size: 'L', color: 'Đen', stock: 10 },
          { size: 'S', color: 'Trắng', stock: 10 },
          { size: 'M', color: 'Trắng', stock: 15 },
          { size: 'L', color: 'Trắng', stock: 10 },
        ]
      },
      {
        productId: '6a181fe4397785b7d0acd18a', // Quần jeans
        variants: [
          { size: '28', color: 'Xanh đậm', stock: 10 },
          { size: '30', color: 'Xanh đậm', stock: 15 },
          { size: '32', color: 'Xanh đậm', stock: 10 },
          { size: '28', color: 'Xanh nhạt', stock: 10 },
          { size: '30', color: 'Xanh nhạt', stock: 15 },
          { size: '32', color: 'Xanh nhạt', stock: 10 },
        ]
      },
      {
        productId: '6a181fe4397785b7d0acd18b', // Áo da
        variants: [
          { size: 'S', color: 'Đen', stock: 5 },
          { size: 'M', color: 'Đen', stock: 10 },
          { size: 'L', color: 'Đen', stock: 5 },
          { size: 'S', color: 'Nâu', stock: 5 },
          { size: 'M', color: 'Nâu', stock: 10 },
          { size: 'L', color: 'Nâu', stock: 5 },
        ]
      },
      {
        productId: '6a181fe4397785b7d0acd18c', // Túi xách
        variants: [
          { size: 'Nhỏ', color: 'Đen', stock: 10 },
          { size: 'Vừa', color: 'Đen', stock: 15 },
          { size: 'Lớn', color: 'Đen', stock: 10 },
          { size: 'Nhỏ', color: 'Nâu', stock: 10 },
          { size: 'Vừa', color: 'Nâu', stock: 15 },
          { size: 'Lớn', color: 'Nâu', stock: 10 },
        ]
      },
      {
        productId: '6a181fe4397785b7d0acd18d', // Quần short
        variants: [
          { size: 'S', color: 'Đen', stock: 10 },
          { size: 'M', color: 'Đen', stock: 15 },
          { size: 'L', color: 'Đen', stock: 10 },
          { size: 'S', color: 'Xanh', stock: 10 },
          { size: 'M', color: 'Xanh', stock: 15 },
          { size: 'L', color: 'Xanh', stock: 10 },
        ]
      },
      {
        productId: '6a181fe4397785b7d0acd191', // Mũ lưỡi trai
        variants: [
          { size: 'M', color: 'Đen', stock: 20 },
          { size: 'M', color: 'Trắng', stock: 20 },
          { size: 'M', color: 'Đỏ', stock: 15 },
          { size: 'M', color: 'Xanh', stock: 15 },
        ]
      },
      {
        productId: '6a181fe4397785b7d0acd193', // Áo len
        variants: [
          { size: 'S', color: 'Be', stock: 5 },
          { size: 'M', color: 'Be', stock: 10 },
          { size: 'L', color: 'Be', stock: 5 },
          { size: 'S', color: 'Xám', stock: 5 },
          { size: 'M', color: 'Xám', stock: 10 },
          { size: 'L', color: 'Xám', stock: 5 },
        ]
      }
    ];

    let updatedCount = 0;

    for (const productData of productsToUpdate) {
      const product = await Product.findById(productData.productId);
      
      if (!product) {
        console.log(`❌ Không tìm thấy sản phẩm với ID: ${productData.productId}`);
        continue;
      }

      if (product.hasVariants && product.variants.length > 0) {
        console.log(`⏭️  Sản phẩm "${product.name}" đã có variants, bỏ qua.`);
        continue;
      }

      // Add variants
      product.variants = productData.variants;
      product.hasVariants = true;
      product.stock = product.variants.reduce((sum, v) => sum + v.stock, 0);

      await product.save();
      console.log(`✅ Đã thêm ${productData.variants.length} variants cho sản phẩm "${product.name}"`);
      updatedCount++;
    }

    console.log(`\n🎉 Hoàn thành! Đã cập nhật ${updatedCount} sản phẩm.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
};

await addVariants();
