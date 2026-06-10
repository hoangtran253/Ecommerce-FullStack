import orderModel from "../models/orderModel.js";
import { StatusCodes } from "http-status-codes";

// Mock các hàm cần thiết để server chạy được
export const createPaymentIntent = (req, res) => {
  res.status(StatusCodes.NOT_IMPLEMENTED).json({
    success: false,
    message: "Stripe payment not configured (mock controller)",
  });
};

export const stripeWebhook = (req, res) => {
  res.status(StatusCodes.OK).json({ received: true });
};

// Create new order
const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, totalAmount } = req.body;
    
    // Create new order
    const order = new orderModel({
      userId: req.user.id,
      items,
      shippingAddress,
      paymentMethod,
      totalAmount,
      status: 'pending',
      paymentStatus: 'pending'
    });

    await order.save();

    res.json({
      success: true,
      message: "Order created successfully",
      order: order
    });

  } catch (error) {
    console.error("Create order error:", error);
    res.json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Process payment (simulate payment)
const processPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({
        success: false,
        message: "Order not found"
      });
    }

    // Simulate payment processing
    // In real application, integrate with your payment gateway here
    order.paymentStatus = 'completed';
    order.status = 'processing';
    await order.save();

    res.json({
      success: true,
      message: "Payment processed successfully",
      order: order
    });

  } catch (error) {
    console.error("Process payment error:", error);
    res.json({
      success: false,
      message: error.message
    });
  }
};

// Get order status
const getOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({
        success: false,
        message: "Order not found"
      });
    }

    res.json({
      success: true,
      status: order.status,
      paymentStatus: order.paymentStatus
    });

  } catch (error) {
    console.error("Get order status error:", error);
    res.json({
      success: false,
      message: error.message
    });
  }
};

export {
  createOrder,
  processPayment,
  getOrderStatus
};