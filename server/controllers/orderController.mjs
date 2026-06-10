import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import reviewModel from "../models/reviewModel.js";
import stockLogModel from "../models/stockLogModel.js";
import {
  deductOrderStock,
  restoreOrderStock,
  validateOrderStock,
} from "../utils/orderStock.mjs";

// Create a new order
const createOrder = async (req, res) => {
  try {
    const { items, amount, address } = req.body;
    const userId = req.user?.id;

    // Debug: Log the received data
    console.log("Order Creation Debug:");
    console.log("Items:", JSON.stringify(items, null, 2));
    console.log("Address:", JSON.stringify(address, null, 2));
    console.log("Amount:", amount);

    // Validate authentication
    if (!userId) {
      return res.json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.json({ success: false, message: "Order items are required" });
    }

    if (!amount) {
      return res.json({ success: false, message: "Order amount is required" });
    }

    if (!address) {
      return res.json({
        success: false,
        message: "Delivery address is required",
      });
    }

    // Validate address required fields with flexible field mapping
    const getAddressValue = (field) => {
      switch (field) {
        case "firstName":
          return (
            address.firstName ||
            address.first_name ||
            address.name?.split(" ")[0] ||
            ""
          );
        case "lastName":
          return (
            address.lastName ||
            address.last_name ||
            address.name?.split(" ").slice(1).join(" ") ||
            ""
          );
        case "zipcode":
          return (
            address.zipcode ||
            address.zipCode ||
            address.zip_code ||
            address.postal_code ||
            ""
          );
        case "street":
          return (
            address.street ||
            address.address ||
            ""
          );
        case "state":
          return (
            address.state ||
            address.province ||
            ""
          );
        case "phone":
          return (
            address.phone ||
            address.phoneNumber ||
            ""
          );
        default:
          return address[field] || "";
      }
    };

    const requiredAddressFields = [
      "firstName",
      "lastName",
      "email",
      "street",
      "city",
      "state",
      "country",
      "phone",
    ];

    const missingFields = requiredAddressFields.filter((field) => {
      const value = getAddressValue(field);
      return !value || value.toString().trim() === "";
    });

    if (missingFields.length > 0) {
      console.log("Missing fields details:");
      missingFields.forEach((field) => {
        console.log(`${field}: "${getAddressValue(field)}"`);
      });
      return res.json({
        success: false,
        message: `Missing required address fields: ${missingFields.join(", ")}`,
        debug: {
          receivedAddress: address,
          missingFields: missingFields.map((field) => ({
            field,
            value: getAddressValue(field),
          })),
        },
      });
    }

    // Validate items have productId
    const itemsWithoutProductId = items.filter(
      (item) => !item._id && !item.productId
    );
    if (itemsWithoutProductId.length > 0) {
      return res.json({
        success: false,
        message: "All items must have a valid product ID",
      });
    }

    // Verify user exists
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    try {
      await validateOrderStock(items);
    } catch (stockErr) {
      return res.json({
        success: false,
        message: stockErr.message || "Không đủ hàng trong kho",
      });
    }

    // Create new order with properly mapped fields
    const newOrder = new orderModel({
      userId,
      items: items.map((item) => ({
        productId: item._id || item.productId,
        name: item.name || item.title,
        price: item.price,
        quantity: item.quantity,
        image: item.images?.[0] || item.image,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        variantStock: item.variantStock,
      })),
      amount,
      address: {
        firstName: getAddressValue("firstName"),
        lastName: getAddressValue("lastName"),
        email: address.email || "",
        street: address.street || address.address || "",
        city: address.city || "",
        state: address.state || address.province || "",
        zipcode: getAddressValue("zipcode"),
        country: address.country || "",
        phone: address.phone || address.phoneNumber || "",
      },
      paymentMethod: "cod", // Default to cash on delivery
      status: "pending",
      paymentStatus: "pending",
      stockDeducted: false,
    });

    await newOrder.save();

    try {
      await deductOrderStock(newOrder, req, "Xuất kho — khách đặt hàng");
      newOrder.stockDeducted = true;
      await newOrder.save();
    } catch (stockErr) {
      await orderModel.findByIdAndDelete(newOrder._id);
      return res.json({
        success: false,
        message: stockErr.message || "Không thể trừ tồn kho",
      });
    }

    // Add order to user's orders array
    await userModel.findByIdAndUpdate(userId, {
      $push: { orders: newOrder._id },
    });

    res.json({
      success: true,
      message: "Đặt hàng thành công — đã trừ tồn kho",
      order: newOrder,
      orderId: newOrder._id,
    });
  } catch (error) {
    console.log("Create Order Error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Get all orders (Admin)
const getAllOrders = async (req, res) => {
  try {
    const { enrichOrdersWithVndPricing } = await import(
      "../utils/orderPricing.mjs"
    );

    const orders = await orderModel
      .find({})
      .populate("userId", "name email avatar")
      .populate("items.productId", "name image price")
      .sort({ date: -1 })
      .lean();

    const ordersWithPricing = await enrichOrdersWithVndPricing(orders);

    res.json({
      success: true,
      orders: ordersWithPricing,
      total: ordersWithPricing.length,
      message: "Orders fetched successfully",
    });
  } catch (error) {
    console.log("Get All Orders Error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Get orders by user ID
const getUserOrders = async (req, res) => {
  try {
    // Check if it's an admin request with userId param
    const { userId } = req.params;
    const requestUserId = userId || req.user?.id; // Use param for admin, auth user for regular users

    if (!requestUserId) {
      return res.json({
        success: false,
        message: "User ID not provided",
      });
    }

    // If the requester is an admin (admin route), include all orders including cancelled.
    // For normal users, hide cancelled orders from their personal list.
    const query = { userId: requestUserId };
    if (!req.user?.role || req.user.role !== "admin") {
      query.status = { $ne: "cancelled" };
    }

    const orders = await orderModel
      .find(query)
      .populate("items.productId", "name image price")
      .sort({ date: -1 });

    res.json({
      success: true,
      orders,
      total: orders.length,
      message: "User orders fetched successfully",
    });
  } catch (error) {
    console.log("Get User Orders Error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Get single order by user ID and order ID
const getUserOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id; // From auth middleware

    const order = await orderModel
      .findOne({ _id: orderId, userId })
      .populate("items.productId", "name image price");

    if (!order) {
      return res.json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      order,
      message: "Order fetched successfully",
    });
  } catch (error) {
    console.log("Get User Order By ID Error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Update order status (Admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status, paymentStatus } = req.body;

    if (!orderId || !status) {
      return res.json({
        success: false,
        message: "Order ID and status are required",
      });
    }

    const validStatuses = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.json({
        success: false,
        message: "Invalid status",
      });
    }

    const validPaymentStatuses = ["pending", "paid", "failed"];
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return res.json({
        success: false,
        message: "Invalid payment status",
      });
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({
        success: false,
        message: "Order not found",
      });
    }

    // Prevent editing orders that were cancelled by the customer; allow admin edits when admin cancelled
    if (order.status === "cancelled" && order.cancelledBy === "user") {
      return res.json({ success: false, message: "Cannot modify a cancelled order (cancelled by customer)" });
    }

    const previousStatus = order.status;
    const previousPaymentStatus = order.paymentStatus;

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    // Hoàn kho nếu hủy đơn đã trừ tồn
    if (status === "cancelled" && order.stockDeducted) {
      await restoreOrderStock(order, req);
      order.stockDeducted = false;
    } else if (
      !order.stockDeducted &&
      (paymentStatus === "paid" || status === "delivered")
    ) {
      // Đơn cũ chưa trừ kho — trừ khi admin đánh Đã thanh toán / Đã giao
      try {
        await deductOrderStock(
          order,
          req,
          status === "delivered"
            ? "Xuất kho — đơn đã giao"
            : "Xuất kho — đã thanh toán"
        );
        order.stockDeducted = true;
      } catch (stockErr) {
        // Không chặn cập nhật nếu trừ kho thất bại, chỉ log lỗi
        console.log("Stock deduction warning:", stockErr.message);
      }
    }

    // Không restore stock khi đổi từ delivered sang trạng thái khác
    // Chỉ restore khi hủy đơn (status === "cancelled") ở logic trên

    // If admin sets cancelled, mark cancelledBy
    if (status === "cancelled") {
      order.cancelledBy = "admin";
      order.cancelledAt = Date.now();
    }

    order.status = status;
    order.updatedAt = Date.now();
    await order.save();

    let message = "Cập nhật đơn hàng thành công";
    if (order.stockDeducted && (status === "delivered" || paymentStatus === "paid")) {
      message = "Cập nhật đơn — đã trừ tồn kho";
    }
    if (status === "cancelled") {
      message = "Đã hủy đơn — đã hoàn tồn kho (nếu có)";
    }

    res.json({
      success: true,
      message,
      order,
    });
  } catch (error) {
    console.log("Update Order Status Error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Allow authenticated user to cancel their own order
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user?.id;

    if (!orderId) {
      return res.json({ success: false, message: "Order ID is required" });
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Only allow owner to cancel
    if (!userId || String(order.userId) !== String(userId)) {
      return res.json({ success: false, message: "Not authorized" });
    }

    if (order.status === "cancelled") {
      return res.json({ success: false, message: "Order already cancelled" });
    }

    // Business rule (option C): disallow cancellation when order already paid AND in confirmed/shipped/delivered
    const protectedStatuses = ["confirmed", "shipped", "delivered"];
    if (order.paymentStatus === "paid" && protectedStatuses.includes(order.status)) {
      return res.json({ success: false, message: "Cannot cancel an order that has been paid and confirmed/shipped/delivered" });
    }

    // Allow cancellation when payment is pending OR when status is confirmed but not yet paid
    const cancellable =
      order.paymentStatus === "pending" ||
      (order.status === "confirmed" && order.paymentStatus !== "paid");

    if (!cancellable) {
      return res.json({ success: false, message: "Order cannot be cancelled at this stage" });
    }

    // If stock was deducted, restore it
    if (order.stockDeducted) {
      try {
        await restoreOrderStock(order, req);
        order.stockDeducted = false;
      } catch (restoreErr) {
        console.log("Restore stock warning:", restoreErr.message);
      }
    }

    order.status = "cancelled";
    order.cancelledBy = "user";
    order.cancelledAt = Date.now();
    order.updatedAt = Date.now();
    await order.save();

    res.json({ success: true, message: "Đã hủy đơn hàng", order });
  } catch (error) {
    console.log("Cancel Order Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get order statistics (Admin Dashboard)
const getOrderStats = async (req, res) => {
  try {
    const totalOrders = await orderModel.countDocuments();
    const pendingOrders = await orderModel.countDocuments({
      status: "pending",
    });
    const deliveredOrders = await orderModel.countDocuments({
      status: "delivered",
    });

    // Calculate total revenue
    const revenueResult = await orderModel.aggregate([
      { $match: { status: { $in: ["delivered", "shipped", "confirmed"] } } },
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
    ]);

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Get recent orders
    const recentOrders = await orderModel
      .find({})
      .populate("userId", "name email avatar")
      .sort({ date: -1 })
      .limit(10);

    // Monthly orders (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyOrders = await orderModel.aggregate([
      { $match: { date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          count: { $sum: 1 },
          revenue: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        deliveredOrders,
        totalRevenue,
        recentOrders,
        monthlyOrders,
      },
      message: "Order statistics fetched successfully",
    });
  } catch (error) {
    console.log("Get Order Stats Error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Delete order (Admin)
const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.json({
        success: false,
        message: "Order ID is required",
      });
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({
        success: false,
        message: "Order not found",
      });
    }

    // Restore stock if it was deducted, regardless of payment status or order status
    // This ensures soldQuantity is correctly reverted when deleting an order
    let restored = false;
    if (order.stockDeducted === true) {
      await restoreOrderStock(order, req);
      restored = true;
    }

    // Delete related reviews (both by orderId and by userId + productId for old reviews)
    const orderProductIds = (order.items || []).map((item) =>
      item.productId?._id || item.productId
    );

    const deletedReviews = await reviewModel.deleteMany({
      $or: [
        { orderId: order._id },
        { userId: order.userId, productId: { $in: orderProductIds } },
      ],
    });

    // Delete related stock logs
    const deletedStockLogs = await stockLogModel.deleteMany({ orderId: order._id });

    // Remove order from user's orders array
    if (order.userId) {
      await userModel.findByIdAndUpdate(order.userId, {
        $pull: { orders: order._id },
      });
    }

    const deleted = await orderModel.findByIdAndDelete(order._id);

    if (!deleted) {
      return res.json({
        success: false,
        message: "Delete failed (order may have been removed already)",
        deletedOrderId: orderId,
      });
    }

    return res.json({
      success: true,
      message: "Order deleted successfully (inventory, reviews, stock logs, and user orders cleaned up)",
      deletedOrderId: String(order._id),
      restored,
      deletedReviews: deletedReviews.deletedCount,
      deletedStockLogs: deletedStockLogs.deletedCount,
    });
  } catch (error) {
    console.log("Delete Order Error:", error);
    return res.json({
      success: false,
      message: error.message,
    });
  }
};



const deleteUserOrders = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.json({ success: false, message: "userId is required" });
    }

    const orders = await orderModel.find({ userId: userId }).lean();

    let totalDeletedReviews = 0;
    let totalDeletedStockLogs = 0;

    // Restore inventory for each order if stock was deducted
    // This ensures soldQuantity is correctly reverted when deleting orders
    for (const order of orders) {
      if (order.stockDeducted === true) {
        // restoreOrderStock expects a mongoose document; fetch full order
        const fullOrder = await orderModel.findById(order._id);
        if (fullOrder) {
          await restoreOrderStock(fullOrder, req);
        }
      }

      // Delete related reviews for this order (both by orderId and by userId + productId for old reviews)
      const orderProductIds = (order.items || []).map((item) =>
        item.productId?._id || item.productId
      );
      const deletedReviews = await reviewModel.deleteMany({
        $or: [
          { orderId: order._id },
          { userId: order.userId, productId: { $in: orderProductIds } },
        ],
      });
      totalDeletedReviews += deletedReviews.deletedCount;

      // Delete related stock logs for this order
      const deletedStockLogs = await stockLogModel.deleteMany({ orderId: order._id });
      totalDeletedStockLogs += deletedStockLogs.deletedCount;
    }

    // Remove all orders from user's orders array
    await userModel.findByIdAndUpdate(userId, {
      $set: { orders: [] },
    });

    await orderModel.deleteMany({ userId: userId });

    res.json({
      success: true,
      message: "Deleted all user orders successfully (inventory, reviews, stock logs, and user orders cleaned up)",
      deletedCount: orders.length,
      totalDeletedReviews,
      totalDeletedStockLogs,
    });
  } catch (error) {
    console.log("DeleteUserOrders Error:", error);
    res.json({ success: false, message: error.message });
  }
};

export {
  createOrder,
  getAllOrders,
  getUserOrders,
  getUserOrderById,
  updateOrderStatus,
  // allow users to cancel their own orders
  cancelOrder,
  getOrderStats,
  deleteOrder,
  deleteUserOrders,
};

