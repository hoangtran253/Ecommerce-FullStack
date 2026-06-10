import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  FaChartLine,
  FaUsers,
  FaShoppingCart,
  FaDollarSign,
  FaBox,
  FaClock,
  FaCheckCircle,
  FaCreditCard,
  FaMoneyBillWave,
  FaSync,
} from "react-icons/fa";
import { serverUrl } from "../../config";
import SkeletonLoader from "../components/SkeletonLoader";
import Title from "../components/ui/title";
import {
  formatCurrency,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from "../utils/dashboard";

const PERIOD_OPTIONS = [
  { value: "1year", label: "12 tháng" },
  { value: "6months", label: "6 tháng" },
  { value: "3months", label: "3 tháng" },
];

const formatChartMoney = (amount) => {
  const n = Number(amount) || 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
};

const Analytics = () => {
  const { token } = useSelector((state) => state.auth);
  const [period, setPeriod] = useState("1year");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${serverUrl}/api/dashboard/analytics?period=${period}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setData(response.data.analytics);
      } else {
        throw new Error(response.data.message || "Không thể tải phân tích");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Không thể tải dữ liệu phân tích"
      );
    } finally {
      setLoading(false);
    }
  }, [token, period]);

  useEffect(() => {
    if (token) fetchAnalytics();
  }, [token, fetchAnalytics]);

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonLoader type="dashboard" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-red-600 text-white rounded-lg"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const monthly = data?.monthlyData || [];
  const maxRevenue = data?.maxRevenue || 1;
  const maxUnits = data?.maxUnits || 1;
  const revenueGrowth = summary.revenueGrowth ?? 0;

  const statCards = [
    {
      title: "Tổng doanh thu",
      sub: "Đơn đã thanh toán",
      value: formatCurrency(summary.totalRevenue),
      icon: <FaDollarSign />,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Doanh thu tháng này",
      sub: `${revenueGrowth >= 0 ? "+" : ""}${revenueGrowth}% so với tháng trước`,
      value: formatCurrency(summary.revenueThisMonth),
      icon: <FaChartLine />,
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      title: "Giá trị đơn TB",
      sub: "Trung bình / đơn đã thanh toán",
      value: formatCurrency(summary.avgOrderValue),
      icon: <FaShoppingCart />,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Khách hàng",
      sub: "Tài khoản role user",
      value: (summary.totalCustomers ?? summary.totalUsers ?? 0).toLocaleString(
        "vi-VN"
      ),
      icon: <FaUsers />,
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "SP đã bán",
      sub: `${(summary.unitsSoldThisMonth || 0).toLocaleString("vi-VN")} SP tháng này`,
      value: (summary.totalUnitsSold || 0).toLocaleString("vi-VN"),
      icon: <FaBox />,
      color: "bg-orange-100 text-orange-600",
    },
    {
      title: "Đơn chờ xử lý",
      sub: `${summary.deliveredOrders || 0} đơn đã giao`,
      value: (summary.pendingOrders || 0).toLocaleString("vi-VN"),
      icon: <FaClock />,
      color: "bg-yellow-100 text-yellow-700",
    },
  ];

  const paymentMethods = data?.paymentByMethod || [];
  const paymentStatuses = data?.paymentByStatus || [];
  const maxPaymentCount = Math.max(
    ...paymentMethods.map((p) => p.count),
    ...paymentStatuses.map((p) => p.count),
    1
  );

  const signupChart = data?.customerSignupsChart || [];
  const maxSignups = Math.max(...signupChart.map((s) => s.users), 1);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Title>Phân tích</Title>
          <p className="text-gray-600 mt-1">
            Số liệu thực từ đơn hàng, doanh thu và khách hàng trong hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <FaSync className="w-4 h-4" />
            Làm mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100"
          >
            <div className={`inline-flex p-3 rounded-lg mb-3 ${stat.color}`}>
              {stat.icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-0.5">
              {stat.value}
            </h3>
            <p className="text-gray-800 text-sm font-medium">{stat.title}</p>
            {stat.sub && (
              <p className="text-gray-500 text-xs mt-1">{stat.sub}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Doanh thu theo tháng
          </h3>
          <div className="overflow-x-auto -mx-1 px-1">
            <div
              className="h-64 flex items-end gap-1 sm:gap-2 pt-4 min-w-[520px]"
              style={{ minWidth: `${Math.max(520, monthly.length * 44)}px` }}
            >
              {monthly.map((m) => (
                <div
                  key={m.label}
                  className="flex-1 flex flex-col items-center gap-1 min-w-[36px] max-w-[56px]"
                >
                  <span
                    className="text-[9px] sm:text-[10px] text-gray-500 text-center leading-tight"
                    title={formatCurrency(m.revenue)}
                  >
                    {formatChartMoney(m.revenue)}
                  </span>
                  <div
                    className="w-full bg-blue-500 rounded-t-md transition-all min-h-[4px]"
                    style={{
                      height: `${Math.max(4, (m.revenue / maxRevenue) * 160)}px`,
                    }}
                    title={formatCurrency(m.revenue)}
                  />
                  <span className="text-[9px] sm:text-[10px] text-gray-500 text-center">
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sản phẩm bán ra theo tháng
          </h3>
          <div className="overflow-x-auto -mx-1 px-1">
            <div
              className="h-64 flex items-end gap-1 sm:gap-2 pt-4 min-w-[520px]"
              style={{ minWidth: `${Math.max(520, monthly.length * 44)}px` }}
            >
              {monthly.map((m) => (
                <div
                  key={`units-${m.label}`}
                  className="flex-1 flex flex-col items-center gap-1 min-w-[36px] max-w-[56px]"
                >
                  <span className="text-[9px] sm:text-[10px] font-medium text-gray-700">
                    {m.unitsSold ?? 0}
                  </span>
                  <div
                    className="w-full bg-orange-500 rounded-t-md min-h-[4px]"
                    style={{
                      height: `${Math.max(
                        4,
                        ((m.unitsSold || 0) / maxUnits) * 160
                      )}px`,
                    }}
                    title={`${m.unitsSold || 0} SP`}
                  />
                  <span className="text-[9px] sm:text-[10px] text-gray-500 text-center">
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Đơn hàng theo tháng
          </h3>
          <div className="overflow-x-auto -mx-1 px-1">
            <div
              className="h-56 flex items-end gap-1 sm:gap-2 pt-4 min-w-[520px]"
              style={{ minWidth: `${Math.max(520, monthly.length * 44)}px` }}
            >
              {monthly.map((m) => {
                const maxOrders = Math.max(...monthly.map((x) => x.orders), 1);
                return (
                  <div
                    key={`orders-${m.label}`}
                    className="flex-1 flex flex-col items-center gap-1 min-w-[36px] max-w-[56px]"
                  >
                    <span className="text-[9px] sm:text-[10px] font-medium text-gray-700">
                      {m.orders}
                    </span>
                    <div
                      className="w-full bg-green-500 rounded-t-md min-h-[4px]"
                      style={{
                        height: `${Math.max(4, (m.orders / maxOrders) * 140)}px`,
                      }}
                      title={`${m.orders} đơn`}
                    />
                    <span className="text-[9px] sm:text-[10px] text-gray-500 text-center">
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Khách đăng ký mới theo tháng
          </h3>
          <div className="overflow-x-auto -mx-1 px-1">
            <div
              className="h-56 flex items-end gap-1 sm:gap-2 pt-4 min-w-[520px]"
              style={{
                minWidth: `${Math.max(520, signupChart.length * 44)}px`,
              }}
            >
              {signupChart.map((s) => (
                <div
                  key={`signup-${s.label}`}
                  className="flex-1 flex flex-col items-center gap-1 min-w-[36px] max-w-[56px]"
                >
                  <span className="text-[9px] sm:text-[10px] font-medium text-purple-700">
                    {s.users}
                  </span>
                  <div
                    className="w-full bg-purple-500 rounded-t-md min-h-[4px]"
                    style={{
                      height: `${Math.max(4, (s.users / maxSignups) * 140)}px`,
                    }}
                  />
                  <span className="text-[9px] sm:text-[10px] text-gray-500 text-center">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Phương thức thanh toán
            </h3>
          </div>
          <div className="space-y-3">
            {paymentMethods.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có dữ liệu</p>
            ) : (
              paymentMethods.map((row) => (
                <div key={row._id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-2 text-gray-700">
                      {row._id === "cod" ? (
                        <FaMoneyBillWave className="text-amber-600" />
                      ) : (
                        <FaCreditCard className="text-blue-600" />
                      )}
                      {PAYMENT_METHOD_LABELS[row._id] || row._id}
                    </span>
                    <span className="font-semibold">{row.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{
                        width: `${(row.count / maxPaymentCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Trạng thái thanh toán
          </h3>
          <div className="space-y-3">
            {paymentStatuses.map((row) => (
              <div key={row._id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">
                    {PAYMENT_STATUS_LABELS[row._id] || row._id}
                  </span>
                  <span className="font-semibold">{row.count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      row._id === "paid" ? "bg-green-500" : "bg-gray-400"
                    }`}
                    style={{
                      width: `${(row.count / maxPaymentCount) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Trạng thái đơn hàng
            </h3>
            <Link to="/orders" className="text-sm text-blue-600 hover:underline">
              Xem đơn
            </Link>
          </div>
          <div className="space-y-3">
            {(data?.ordersByStatus || []).map((row) => (
              <div
                key={row._id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-sm font-medium text-gray-700">
                  {ORDER_STATUS_LABELS[row._id] || row._id}
                </span>
                <span className="font-bold text-gray-900">{row.count}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4 flex items-center gap-1">
            <FaCheckCircle className="text-green-600" />
            {summary.paidOrders || 0} đơn đã thanh toán · Tỷ lệ{" "}
            <span className="font-semibold text-gray-800">
              {summary.conversionRate || 0}%
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Top sản phẩm bán chạy
            </h3>
            <Link to="/list" className="text-sm text-blue-600 hover:underline">
              Xem sản phẩm
            </Link>
          </div>
          <div className="space-y-3">
            {(data?.topProducts || []).length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có đơn đã thanh toán</p>
            ) : (
              (data?.topProducts || []).map((p, i) => (
                <div
                  key={p._id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <span className="w-6 h-6 rounded-full bg-gray-800 text-white text-xs flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">
                      Đã bán: {p.soldQuantity || 0} · Tồn: {p.stock ?? "—"}
                    </p>
                  </div>
                  <span className="text-sm font-semibold shrink-0">
                    {formatCurrency(p.price)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top theo doanh thu (tên SP trong đơn)
          </h3>
          <div className="space-y-3">
            {(data?.topSellingItems || []).length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có dữ liệu</p>
            ) : (
              (data?.topSellingItems || []).map((p, i) => (
                <div
                  key={p._id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <span className="w-6 h-6 rounded-full bg-blue-800 text-white text-xs flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p._id}</p>
                    <p className="text-xs text-gray-500">
                      {p.unitsSold || 0} SP đã bán
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-green-700 shrink-0">
                    {formatCurrency(p.revenue)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
