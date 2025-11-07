import express from "express";
import {
  createOrder,
  processPayment,
  getOrderStatus
} from "../controllers/paymentController.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

// Order routes
router.post("/api/order/create", userAuth, createOrder);
router.post("/api/payment/process", userAuth, processPayment);
router.get("/api/order/:orderId/status", userAuth, getOrderStatus);

export default router;
