import { Router } from "express";
import {
  createOrder,
  getAllOrders,
  getUserOrders,
  getUserOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
  deleteOrder,
  deleteUserOrders,
} from "../controllers/orderController.mjs";
import adminAuth from "../middleware/adminAuth.js";
import userAuth from "../middleware/userAuth.js";

const router = Router();

const routeValue = "/api/order/";

// User routes (require authentication)
router.post(`${routeValue}create`, userAuth, createOrder);
router.get(`${routeValue}my-orders`, userAuth, getUserOrders);
router.get(`${routeValue}user/:orderId`, userAuth, getUserOrderById);

// Admin routes
router.get(`${routeValue}admin/user/:userId`, adminAuth, getUserOrders);
router.get(`${routeValue}list`, adminAuth, getAllOrders);
router.get(`${routeValue}stats`, adminAuth, getOrderStats);
router.post(`${routeValue}update-status`, adminAuth, updateOrderStatus);
// Allow user to cancel own order
router.post(`${routeValue}cancel`, userAuth, cancelOrder);
router.post(`${routeValue}delete`, adminAuth, deleteOrder);

// Admin: delete all orders of a user
router.post(`${routeValue}delete-user-orders`, adminAuth, deleteUserOrders);

export default router;


