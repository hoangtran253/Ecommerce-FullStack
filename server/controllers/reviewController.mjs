import reviewModel from "../models/reviewModel.js";
import productModel from "../models/productModel.js";
import {
  findUserPurchaseOrder,
  isOrderEligibleForReview,
} from "../utils/orderPurchase.mjs";

const calcAverage = (reviews) => {
  if (!reviews.length) return 0;
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
};

/** POST /api/review — khách đánh giá (cần đăng nhập) */
export const createReview = async (req, res) => {
  try {
    console.log("createReview called with body:", req.body);
    console.log("User:", req.user);

    const { productId, rating, comment, orderId } = req.body;

    if (!productId || !rating) {
      return res.json({
        success: false,
        message: "Vui lòng chọn sản phẩm và số sao",
      });
    }

    const stars = Number(rating);
    if (stars < 1 || stars > 5) {
      return res.json({
        success: false,
        message: "Đánh giá từ 1 đến 5 sao",
      });
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return res.json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    const purchaseOrder = await findUserPurchaseOrder(
      req.user._id,
      productId,
      orderId || null
    );
    if (!purchaseOrder) {
      return res.json({
        success: false,
        message:
          "Chỉ khách đã thanh toán và nhận hàng mới được đánh giá sản phẩm này",
      });
    }

    if (orderId && !isOrderEligibleForReview(purchaseOrder)) {
      return res.json({
        success: false,
        message: "Đơn hàng chưa đủ điều kiện để đánh giá",
      });
    }

    const existing = await reviewModel.findOne({
      productId,
      userId: req.user._id,
    });
    if (existing) {
      return res.json({
        success: false,
        message: "Bạn đã đánh giá sản phẩm này. Liên hệ admin để chỉnh sửa.",
      });
    }

    const review = await reviewModel.create({
      productId,
      userId: req.user._id,
      orderId: orderId || null,
      reviewerName: req.user.name || req.user.email,
      rating: stars,
      comment: comment?.trim() || "",
      isApproved: true,
    });

    console.log("Review created:", review);

    // Update product rating
    const allReviews = await reviewModel.find({ productId, isApproved: true });
    const averageRating = calcAverage(allReviews);
    product.rating = averageRating;
    await product.save();

    console.log("Updated product rating:", product.name, "to", averageRating);

    res.json({
      success: true,
      message: "Gửi đánh giá thành công",
      review,
    });
  } catch (error) {
    console.log("createReview error:", error);
    res.json({ success: false, message: error.message });
  }
};

/** GET /api/review/product/:productId — hiển thị trên trang SP */
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await reviewModel
      .find({ productId, isApproved: true })
      .sort({ createdAt: -1 })
      .populate("userId", "name avatar")
      .lean();

    res.json({
      success: true,
      reviews: reviews.map((r) => ({
        _id: r._id,
        reviewerName: r.reviewerName || r.userId?.name,
        reviewerAvatar: r.userId?.avatar || "",
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
      })),
      averageRating: calcAverage(reviews),
      total: reviews.length,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/** GET /api/review/list — admin */
export const listReviews = async (req, res) => {
  try {
    const reviews = await reviewModel
      .find({})
      .sort({ createdAt: -1 })
      .populate("productId", "name images")
      .populate("userId", "name email avatar")
      .lean();

    res.json({ success: true, reviews, total: reviews.length });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/** PUT /api/review/:id — admin */
export const updateReview = async (req, res) => {
  try {
    const { rating, comment, isApproved, reviewerName } = req.body;
    const review = await reviewModel.findById(req.params.id);

    if (!review) {
      return res.json({ success: false, message: "Không tìm thấy đánh giá" });
    }

    if (rating != null) {
      const stars = Number(rating);
      if (stars < 1 || stars > 5) {
        return res.json({ success: false, message: "Sao từ 1–5" });
      }
      review.rating = stars;
    }
    if (comment != null) review.comment = String(comment).trim();
    if (reviewerName != null) review.reviewerName = reviewerName;
    if (isApproved != null) review.isApproved = Boolean(isApproved);

    await review.save();

    // Update product rating
    const allReviews = await reviewModel.find({ productId: review.productId, isApproved: true });
    const averageRating = calcAverage(allReviews);
    const product = await productModel.findById(review.productId);
    if (product) {
      product.rating = averageRating;
      await product.save();
    }

    res.json({
      success: true,
      message: "Cập nhật đánh giá thành công",
      review,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/** GET /api/review/mine/:productId — đánh giá của user cho SP */
export const getMyProductReview = async (req, res) => {
  try {
    const review = await reviewModel
      .findOne({
        productId: req.params.productId,
        userId: req.user._id,
      })
      .lean();

    res.json({ success: true, review: review || null });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/** DELETE /api/review/:id — admin */
export const deleteReview = async (req, res) => {
  try {
    const deleted = await reviewModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.json({ success: false, message: "Không tìm thấy đánh giá" });
    }

    // Update product rating
    const allReviews = await reviewModel.find({ productId: deleted.productId, isApproved: true });
    const averageRating = calcAverage(allReviews);
    const product = await productModel.findById(deleted.productId);
    if (product) {
      product.rating = averageRating;
      await product.save();
    }

    res.json({ success: true, message: "Đã xóa đánh giá" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/** PUT /api/review/user/:id — user update their own review */
export const updateUserReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const review = await reviewModel.findById(req.params.id);

    if (!review) {
      return res.json({ success: false, message: "Không tìm thấy đánh giá" });
    }

    // Check if the review belongs to the user
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.json({
        success: false,
        message: "Bạn chỉ có thể chỉnh sửa đánh giá của mình",
      });
    }

    if (rating != null) {
      const stars = Number(rating);
      if (stars < 1 || stars > 5) {
        return res.json({ success: false, message: "Đánh giá từ 1 đến 5 sao" });
      }
      review.rating = stars;
    }
    if (comment != null) review.comment = String(comment).trim();

    await review.save();

    // Update product rating
    const allReviews = await reviewModel.find({ productId: review.productId, isApproved: true });
    const averageRating = calcAverage(allReviews);
    const product = await productModel.findById(review.productId);
    if (product) {
      product.rating = averageRating;
      await product.save();
    }

    res.json({
      success: true,
      message: "Cập nhật đánh giá thành công",
      review,
    });
  } catch (error) {
    console.log("updateUserReview error:", error);
    res.json({ success: false, message: error.message });
  }
};

/** DELETE /api/review/user/:id — user delete their own review */
export const deleteUserReview = async (req, res) => {
  try {
    const review = await reviewModel.findById(req.params.id);

    if (!review) {
      return res.json({ success: false, message: "Không tìm thấy đánh giá" });
    }

    // Check if the review belongs to the user
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.json({
        success: false,
        message: "Bạn chỉ có thể xóa đánh giá của mình",
      });
    }

    const productId = review.productId;
    await reviewModel.findByIdAndDelete(req.params.id);

    // Update product rating
    const allReviews = await reviewModel.find({ productId, isApproved: true });
    const averageRating = calcAverage(allReviews);
    const product = await productModel.findById(productId);
    if (product) {
      product.rating = averageRating;
      await product.save();
    }

    res.json({ success: true, message: "Đã xóa đánh giá" });
  } catch (error) {
    console.log("deleteUserReview error:", error);
    res.json({ success: false, message: error.message });
  }
};
