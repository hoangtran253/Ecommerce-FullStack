import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import axios from "axios";
import Title from "../components/ui/title";
import SkeletonLoader from "../components/SkeletonLoader";
import { serverUrl } from "../../config";

const Home = () => {
  const { token } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    recentOrders: [],
    topProducts: [],
    loading: true,
    error: null,
  });

  const fetchStatistics = useCallback(async () => {
    try {
      setStats((prev) => ({ ...prev, loading: true, error: null }));

      // Fetch real data from server APIs
      const response = await axios.get(`${serverUrl}/api/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const { stats: serverStats } = response.data;

        setStats({
          totalProducts: serverStats.totalProducts || 0,
          totalOrders: serverStats.totalOrders || 0,
          totalUsers: serverStats.totalUsers || 0,
          totalRevenue: serverStats.totalRevenue || 0,
          recentOrders: serverStats.recentOrders || [],
          topProducts: serverStats.topProducts || [],
          loading: false,
        });
      } else {
        throw new Error(response.data.message || "Không thể lấy số liệu thống kê");
      }
    } catch (error) {
      console.error("Lỗi khi lấy số liệu thống kê:", error);
      setStats((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "Không thể tải dữ liệu bảng điều khiển",
      }));
    }
  }, [token]);

  useEffect(() => {
    fetchStatistics();
  }, [token, fetchStatistics]);

  const StatCard = ({ title, value, icon, color, change, changeType }) => (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
          {change && (
            <div
              className={`flex items-center mt-2 text-sm ${
                changeType === "positive" ? "text-green-600" : "text-red-600"
              }`}
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d={
                    changeType === "positive"
                      ? "M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L10 4.414 4.707 9.707a1 1 0 01-1.414 0z"
                      : "M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L10 15.586l5.293-5.293a1 1 0 011.414 0z"
                  }
                  clipRule="evenodd"
                />
              </svg>
              {change}
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
    change: PropTypes.string,
    changeType: PropTypes.oneOf(["positive", "negative"]),
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatStatus = (status) => {
    switch (status) {
      case "delivered":
        return "Đã giao";
      case "shipped":
        return "Đã gửi";
      case "pending":
        return "Đang chờ";
      default:
        return status;
    }
  };

  if (stats.loading) {
    return <SkeletonLoader type="dashboard" />;
  }

  if (stats.error) {
    return (
      <div className="space-y-8">
        <div>
          <Title>Tổng quan Bảng điều khiển</Title>
          <p className="text-gray-600 mt-2">
            Chào mừng trở lại! Đây là những gì đang diễn ra với cửa hàng của bạn hôm nay.
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-red-800 mb-2">
            Không thể tải dữ liệu Bảng điều khiển
          </h3>
          <p className="text-red-600 mb-4">{stats.error}</p>
          <button
            onClick={fetchStatistics}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Title>Tổng quan Bảng điều khiển</Title>
        <p className="text-gray-600 mt-2">
          Chào mừng trở lại! Đây là những gì đang diễn ra với cửa hàng của bạn hôm nay.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng Sản phẩm"
          value={stats.totalProducts.toLocaleString()}
          change="+12%"
          changeType="positive"
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
          title="Tổng Đơn hàng"
          value={stats.totalOrders.toLocaleString()}
          change="+8%"
          changeType="positive"
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
          title="Tổng Người dùng"
          value={stats.totalUsers.toLocaleString()}
          change="+15%"
          changeType="positive"
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
          title="Tổng Doanh thu"
          value={formatCurrency(stats.totalRevenue)}
          change="+23%"
          changeType="positive"
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

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">Đơn hàng gần đây</h3>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Xem tất cả
            </button>
          </div>

          <div className="space-y-4">
            {stats.recentOrders.length > 0 ? (
              stats.recentOrders.map((order, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      Đơn hàng #{order._id?.slice(-8) || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.userId?.name ||
                        order.address?.firstName ||
                        "Khách hàng"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(order.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {formatCurrency(order.amount || 0)}
                    </p>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        order.status === "delivered"
                          ? "bg-green-100 text-green-800"
                          : order.status === "shipped"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {formatStatus(order.status) || "đang chờ"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">Không có đơn hàng gần đây</p>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">
              Sản phẩm phổ biến
            </h3>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Xem tất cả
            </button>
          </div>

          <div className="space-y-4">
            {stats.topProducts.length > 0 ? (
              stats.topProducts.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">
                      {product.name || "Tên sản phẩm"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {product.category || "Danh mục"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">
                      {formatCurrency(product.price || 0)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Kho: {product.stock || 0}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">
                Không có sản phẩm nào
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <h3 className="text-2xl font-bold mb-4">Hành động nhanh</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300 rounded-xl p-4 text-left">
            <div className="flex items-center space-x-3">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span className="font-semibold">Thêm sản phẩm mới</span>
            </div>
          </button>

          <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300 rounded-xl p-4 text-left">
            <div className="flex items-center space-x-3">
              <svg
                className="w-6 h-6"
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
              <span className="font-semibold">Xem đơn hàng</span>
            </div>
          </button>

          <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300 rounded-xl p-4 text-left">
            <div className="flex items-center space-x-3">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="font-semibold">Quản lý người dùng</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
