import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from server directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import connectDB from '../config/mongodb.js';
import Order from '../models/orderModel.js';

const checkOrderData = async () => {
  try {
    await connectDB();
    console.log('🔍 Đang kiểm tra đơn hàng...\n');

    const orders = await Order.find({}).sort({ createdAt: -1 }).limit(5);
    
    if (orders.length === 0) {
      console.log('❌ Không có đơn hàng nào');
      process.exit(1);
    }

    orders.forEach((order, index) => {
      console.log(`\n${index + 1}. Đơn #${order._id.toString().slice(-6).toUpperCase()}`);
      console.log(`   - Status: ${order.status}`);
      console.log(`   - Amount: ${order.amount}`);
      console.log(`   - Items length: ${order.items?.length || 0}`);
      
      if (order.items && order.items.length > 0) {
        order.items.forEach((item, i) => {
          console.log(`   - Item ${i + 1}:`);
          console.log(`     • Name: ${item.name}`);
          console.log(`     • Quantity: ${item.quantity}`);
          console.log(`     • Price: ${item.price}`);
          console.log(`     • ProductId: ${item.productId}`);
        });
        
        const totalQuantity = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        console.log(`   - Tổng số lượng (tính từ items): ${totalQuantity}`);
      }
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
};

checkOrderData();
