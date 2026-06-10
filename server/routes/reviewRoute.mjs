import { Router } from "express";
import userAuth from "../middleware/userAuth.js";
import adminAuth from "../middleware/adminAuth.js";
import {
  createReview,
  getProductReviews,
  getMyProductReview,
  listReviews,
  updateReview,
  deleteReview,
  updateUserReview,
  deleteUserReview,
} from "../controllers/reviewController.mjs";

const router = Router();

router.post("/api/review", userAuth, createReview);
router.get("/api/review/mine/:productId", userAuth, getMyProductReview);
router.get("/api/review/product/:productId", getProductReviews);
router.get("/api/review/list", adminAuth, listReviews);
router.put("/api/review/:id", adminAuth, updateReview);
router.delete("/api/review/:id", adminAuth, deleteReview);
router.put("/api/review/user/:id", userAuth, updateUserReview);
router.delete("/api/review/user/:id", userAuth, deleteUserReview);

export default router;
