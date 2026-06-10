import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";
import {
  PAID_SALES_MATCH,
  COUNTABLE_ORDER_MATCH,
  enrichOrdersWithVndPricing,
  aggregatePaidSales,
  buildPricingContext,
  getCatalogPriceForItem,
  resolveItemUnitPrice,
} from "../utils/orderPricing.mjs";
import { getRegisteredCustomerStats } from "../utils/userStats.mjs";

/** Tạo đủ N tháng gần nhất (kể cả tháng không có đơn → 0) */
const buildMonthBuckets = (monthCount = 12) => {
  const now = new Date();
  const buckets = [];
  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      orders: 0,
      revenue: 0,
      unitsSold: 0,
    });
  }
  return buckets;
};

const getPeriodMonthCount = (period) => {
  if (period === "3months") return 3;
  if (period === "6months") return 6;
  return 12;
};

const getPaidMonthlyChartData = async (monthCount = 12) => {
  const buckets = buildMonthBuckets(monthCount);
  const bucketMap = new Map(
    buckets.map((b) => [`${b.year}-${b.month}`, b])
  );

  const startDate = new Date(
    buckets[0].year,
    buckets[0].month - 1,
    1
  );

  const orders = await orderModel
    .find({ ...PAID_SALES_MATCH, date: { $gte: startDate } })
    .select("items date")
    .lean();

  const ctx = await buildPricingContext(orders);

  for (const order of orders) {
    const d = new Date(order.date);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const bucket = bucketMap.get(key);
    if (!bucket) continue;

    bucket.orders += 1;

    for (const item of order.items || []) {
      const qty = Number(item.quantity) || 1;
      const catalog = getCatalogPriceForItem(item, ctx);
      const unit = resolveItemUnitPrice(item, catalog);
      bucket.unitsSold += qty;
      bucket.revenue += unit * qty;
    }
  }

  return buckets;
};

const getTopSellingItemsByName = async (limit = 6) => {
  const orders = await orderModel.find(PAID_SALES_MATCH).select("items").lean();
  const ctx = await buildPricingContext(orders);
  const byName = new Map();

  for (const order of orders) {
    for (const item of order.items || []) {
      const name = item.name || "Khác";
      const qty = Number(item.quantity) || 1;
      const catalog = getCatalogPriceForItem(item, ctx);
      const unit = resolveItemUnitPrice(item, catalog);
      const prev = byName.get(name) || { unitsSold: 0, revenue: 0 };
      byName.set(name, {
        unitsSold: prev.unitsSold + qty,
        revenue: prev.revenue + unit * qty,
      });
    }
  }

  return [...byName.entries()]
    .map(([_id, data]) => ({ _id, ...data }))
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, limit);
};

const MONTH_LABELS = [
  "T1",
  "T2",
  "T3",
  "T4",
  "T5",
  "T6",
  "T7",
  "T8",
  "T9",
  "T10",
  "T11",
  "T12",
];

const getMonthRanges = () => {
  const now = new Date();
  const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  return { now, startThisMonth, startLastMonth, startTwoMonthsAgo };
};

const getTopProductsFromPaidOrders = async (limit = 5) => {
  const soldByProduct = await orderModel.aggregate([
    { $match: PAID_SALES_MATCH },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        unitsSold: { $sum: "$items.quantity" },
      },
    },
    { $match: { _id: { $ne: null }, unitsSold: { $gt: 0 } } },
    { $sort: { unitsSold: -1 } },
    { $limit: limit },
  ]);

  if (!soldByProduct.length) return [];

  const productIds = soldByProduct.map((row) => row._id);
  const products = await productModel
    .find({ _id: { $in: productIds } })
    .select("name category price stock images image")
    .lean();

  const productMap = new Map(products.map((p) => [String(p._id), p]));

  return soldByProduct
    .map((row) => {
      const product = productMap.get(String(row._id));
      if (!product) return null;
      return {
        ...product,
        soldQuantity: row.unitsSold,
      };
    })
    .filter(Boolean);
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.json({
        success: false,
        message: "Admin access required for dashboard statistics",
      });
    }

    const { startThisMonth, startLastMonth } = getMonthRanges();

    const customerStatsPromise = getRegisteredCustomerStats({
      startThisMonth,
      startLastMonth,
    });

    const [
      customerStats,
      totalProducts,
      totalOrders,
      salesAll,
      salesThisMonth,
      salesLastMonth,
      ordersThisMonth,
      ordersLastMonth,
      recentOrders,
      topProducts,
      ordersByStatus,
    ] = await Promise.all([
      customerStatsPromise,
      productModel.countDocuments(),
      orderModel.countDocuments(COUNTABLE_ORDER_MATCH),
      aggregatePaidSales(),
      aggregatePaidSales({ date: { $gte: startThisMonth } }),
      aggregatePaidSales({
        date: { $gte: startLastMonth, $lt: startThisMonth },
      }),
      orderModel.countDocuments({
        ...COUNTABLE_ORDER_MATCH,
        date: { $gte: startThisMonth },
      }),
      orderModel.countDocuments({
        ...COUNTABLE_ORDER_MATCH,
        date: { $gte: startLastMonth, $lt: startThisMonth },
      }),
      orderModel
        .find({ status: { $ne: "cancelled" } })
        .populate("userId", "name email avatar")
        .sort({ date: -1 })
        .limit(5)
        .lean()
        .then(enrichOrdersWithVndPricing),
      getTopProductsFromPaidOrders(5),
      orderModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const stats = {
      totalProducts,
      totalOrders,
      totalUsers: customerStats.total,
      totalCustomers: customerStats.total,
      recentUsers: customerStats.recent,
      totalRevenue: salesAll.totalRevenue,
      totalUnitsSold: salesAll.totalUnitsSold,
      recentOrders,
      topProducts,
      ordersByStatus,
      growth: {
        products: 0,
        orders: calcGrowth(ordersThisMonth, ordersLastMonth),
        users: calcGrowth(customerStats.thisMonth, customerStats.lastMonth),
        revenue: calcGrowth(
          salesThisMonth.totalRevenue,
          salesLastMonth.totalRevenue
        ),
      },
      period: {
        revenueThisMonth: salesThisMonth.totalRevenue,
        revenueLastMonth: salesLastMonth.totalRevenue,
        ordersThisMonth,
        ordersLastMonth,
        unitsSoldThisMonth: salesThisMonth.totalUnitsSold,
      },
    };

    res.json({
      success: true,
      stats,
      message: "Dashboard statistics fetched successfully",
    });
  } catch (error) {
    console.log("Get Dashboard Stats Error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

function calcGrowth(current, previous) {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// Get analytics data for charts
const getAnalytics = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.json({
        success: false,
        message: "Admin access required for analytics data",
      });
    }

    const { period = "1year" } = req.query;
    const chartMonthCount = getPeriodMonthCount(period);

    const chartStartDate = new Date();
    chartStartDate.setMonth(
      chartStartDate.getMonth() - (chartMonthCount - 1)
    );
    chartStartDate.setDate(1);
    chartStartDate.setHours(0, 0, 0, 0);

    const { total: totalUsers } = await getRegisteredCustomerStats();

    const { startThisMonth, startLastMonth } = getMonthRanges();

    const [
      totalOrders,
      salesAll,
      paidOrders,
      monthlyData,
      userRegistrations,
      ordersByStatus,
      topProducts,
      topCategories,
      salesThisMonth,
      salesLastMonth,
      paymentByMethod,
      paymentByStatus,
      pendingOrders,
      deliveredOrders,
    ] = await Promise.all([
      orderModel.countDocuments(COUNTABLE_ORDER_MATCH),
      aggregatePaidSales(),
      orderModel.countDocuments(PAID_SALES_MATCH),
      getPaidMonthlyChartData(chartMonthCount),
      userModel.aggregate([
        { $match: { createdAt: { $gte: chartStartDate }, role: "user" } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            users: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      orderModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      getTopProductsFromPaidOrders(8),
      getTopSellingItemsByName(6),
      aggregatePaidSales({ date: { $gte: startThisMonth } }),
      aggregatePaidSales({
        date: { $gte: startLastMonth, $lt: startThisMonth },
      }),
      orderModel.aggregate([
        { $match: COUNTABLE_ORDER_MATCH },
        { $group: { _id: "$paymentMethod", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      orderModel.aggregate([
        { $match: COUNTABLE_ORDER_MATCH },
        { $group: { _id: "$paymentStatus", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      orderModel.countDocuments({ status: "pending" }),
      orderModel.countDocuments({ status: "delivered" }),
    ]);

    const conversionRate =
      totalUsers > 0
        ? Number(((paidOrders / totalUsers) * 100).toFixed(2))
        : 0;

    const chartMonthly = monthlyData.map((row) => ({
      label: `${MONTH_LABELS[row.month - 1]}/${String(row.year).slice(-2)}`,
      orders: row.orders,
      revenue: row.revenue,
      unitsSold: row.unitsSold,
    }));

    const maxRevenue = Math.max(...chartMonthly.map((m) => m.revenue), 1);
    const maxUnits = Math.max(...chartMonthly.map((m) => m.unitsSold), 1);

    const avgOrderValue =
      paidOrders > 0
        ? Math.round(salesAll.totalRevenue / paidOrders)
        : 0;

    const revenueGrowth = calcGrowth(
      salesThisMonth.totalRevenue,
      salesLastMonth.totalRevenue
    );

    const userRegByKey = new Map(
      userRegistrations.map((r) => [
        `${r._id.year}-${r._id.month}`,
        r.users,
      ])
    );

    const customerSignupsChart = monthlyData.map((row) => ({
      label: `${MONTH_LABELS[row.month - 1]}/${String(row.year).slice(-2)}`,
      users: userRegByKey.get(`${row.year}-${row.month}`) || 0,
    }));

    res.json({
      success: true,
      analytics: {
        summary: {
          totalRevenue: salesAll.totalRevenue,
          totalOrders,
          totalUsers,
          totalCustomers: totalUsers,
          totalUnitsSold: salesAll.totalUnitsSold,
          paidOrders,
          conversionRate,
          avgOrderValue,
          revenueThisMonth: salesThisMonth.totalRevenue,
          revenueLastMonth: salesLastMonth.totalRevenue,
          revenueGrowth,
          unitsSoldThisMonth: salesThisMonth.totalUnitsSold,
          pendingOrders,
          deliveredOrders,
        },
        monthlyData: chartMonthly,
        maxRevenue,
        maxUnits,
        userRegistrations,
        customerSignupsChart,
        ordersByStatus,
        paymentByMethod,
        paymentByStatus,
        topProducts,
        topSellingItems: topCategories,
        period,
      },
      message: "Analytics data fetched successfully",
    });
  } catch (error) {
    console.log("Get Analytics Error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Get quick stats for sidebar
const getQuickStats = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.json({
        success: false,
        message: "Admin access required for quick statistics",
      });
    }

    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    const salesToday = await aggregatePaidSales({
      date: { $gte: startOfDay, $lt: endOfDay },
    });

    const todaysOrders = await orderModel.countDocuments({
      date: { $gte: startOfDay, $lt: endOfDay },
      ...PAID_SALES_MATCH,
    });

    res.json({
      success: true,
      quickStats: {
        todaysSales: salesToday.totalRevenue,
        todaysOrders,
        todaysUnitsSold: salesToday.totalUnitsSold,
      },
      message: "Quick statistics fetched successfully",
    });
  } catch (error) {
    console.log("Get Quick Stats Error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export { getDashboardStats, getAnalytics, getQuickStats };
