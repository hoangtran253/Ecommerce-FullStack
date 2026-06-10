import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import axios from "axios";
import Title from "../components/ui/title";
import SkeletonLoader from "../components/SkeletonLoader";
import { serverUrl } from "../../config";
import { FaSync } from "react-icons/fa";
import {
  formatCurrency,
  formatDate,
  ORDER_STATUS_LABELS,
  getOrderCustomerName,
  getOrderDisplayAmount,
} from "../utils/dashboard";

const Home = () => {
  const { token } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalUnitsSold: 0,
    recentOrders: [],
    topProducts: [],
    growth: { products: 0, orders: 0, users: 0, revenue: 0 },
    loading: true,
    error: null,
  });

  const fetchStatistics = useCallback(async () => {
    try {
      setStats((prev) => ({ ...prev, loading: true, error: null }));

      const response = await axios.get(`${serverUrl}/api/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const { stats: serverStats } = response.data;
        setStats({
          totalProducts: serverStats.totalProducts || 0,
          totalOrders: serverStats.totalOrders || 0,
          totalUsers: serverStats.totalUsers || 0,
          totalRevenue: serverStats.totalRevenue || 0,
          totalUnitsSold: serverStats.totalUnitsSold || 0,
          recentOrders: serverStats.recentOrders || [],
          topProducts: serverStats.topProducts || [],
          growth: serverStats.growth || {
            products: 0,
            orders: 0,
            users: 0,
            revenue: 0,
          },
          loading: false,
          error: null,
        });
      } else {
        throw new Error(
          response.data.message || "Không thể lấy số liệu thống kê"
        );
      }
    } catch (error) {
      console.error("Lỗi khi lấy số liệu thống kê:", error);
      setStats((prev) => ({
        ...prev,
        loading: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Không thể tải dữ liệu bảng điều khiển",
      }));
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchStatistics();
  }, [token, fetchStatistics]);

  const StatCard = ({ title, value, icon, color, change, changeType, sub }) => (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          <p className="text-2xl lg:text-3xl font-bold text-gray-800">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
          {change !== undefined && change !== null && (
            <div
              className={`flex items-center mt-2 text-sm ${
                changeType === "positive" ? "text-green-600" : "text-red-600"
              }`}
            >
              {changeType === "positive" ? "↑" : "↓"} {Math.abs(change)}% so
              với tháng trước
            </div>
          )}
        </div>
        <div className={`p-4 rounded-2xl ${color}`}>{icon}</div>
      </div>
    </div>
  );

  StatCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    icon: PropTypes.element.isRequired,
    color: PropTypes.string.isRequired,
    change: PropTypes.number,
    changeType: PropTypes.oneOf(["positive", "negative"]),
    sub: PropTypes.string,
  };

  const growthType = (n) => (n >= 0 ? "positive" : "negative");

  if (stats.loading) {
    return <SkeletonLoader type="dashboard" />;
  }

  if (stats.error) {
    return (
      <div className="space-y-8">
        <Title>Tổng quan</Title>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-semibold text-red-800 mb-2">
            Không thể tải dữ liệu
          </h3>
          <p className="text-red-600 mb-4">{stats.error}</p>
          <button
            onClick={fetchStatistics}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Title>Tổng quan</Title>
          <p className="text-gray-600 mt-2">
            Số liệu thực từ đơn hàng và sản phẩm đã bán trong hệ thống.
          </p>
        </div>
        <button
          onClick={fetchStatistics}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <FaSync className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng sản phẩm"
          value={stats.totalProducts.toLocaleString("vi-VN")}
          color="bg-blue-100"
          icon={
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          }
        />
        <StatCard
          title="Tổng đơn hàng"
          sub="Đã thanh toán hoặc đang/đã giao"
          value={stats.totalOrders.toLocaleString("vi-VN")}
          change={stats.growth.orders}
          changeType={growthType(stats.growth.orders)}
          color="bg-green-100"
          icon={
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          }
        />
        <StatCard
          title="Khách hàng"
          sub="Tài khoản đã đăng ký (Quản lý người dùng)"
          value={stats.totalUsers.toLocaleString("vi-VN")}
          change={stats.growth.users}
          changeType={growthType(stats.growth.users)}
          color="bg-purple-100"
          icon={
            <svg
              className="w-8 h-8 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
          }
        />
        <StatCard
          title="Tổng doanh thu"
          value={formatCurrency(stats.totalRevenue)}
          sub={`${stats.totalUnitsSold.toLocaleString("vi-VN")} SP đã bán (đơn đã thanh toán)`}
          change={stats.growth.revenue}
          changeType={growthType(stats.growth.revenue)}
          color="bg-orange-100"
          icon={
            <svg
              className="w-8 h-8 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">Đơn hàng gần đây</h3>
            <Link
              to="/orders"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Xem tất cả →
            </Link>
          </div>
          <div className="space-y-4">
            {stats.recentOrders.length > 0 ? (
              stats.recentOrders.map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      #{String(order._id).slice(-8).toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {getOrderCustomerName(order)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(order.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {formatCurrency(getOrderDisplayAmount(order))}
                    </p>
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 mt-1">
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">
                Chưa có đơn hàng
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">
              Sản phẩm bán chạy
            </h3>
            <Link
              to="/list"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Xem tất cả →
            </Link>
          </div>
          <div className="space-y-4">
            {stats.topProducts.length > 0 ? (
              stats.topProducts.map((product, index) => (
                <div
                  key={product._id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                    {(product.images?.[0] || product.image) ? (
                      <img
                        src={product.images?.[0] || product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 text-white font-bold">
                        {index + 1}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">
                      {product.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {product.category || "—"} · Đã bán (đã thanh toán):{" "}
                      {product.soldQuantity || 0}
                    </p>
                  </div>
                  <p className="font-bold text-gray-800 text-sm">
                    {formatCurrency(product.price || 0)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">Chưa có dữ liệu</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
