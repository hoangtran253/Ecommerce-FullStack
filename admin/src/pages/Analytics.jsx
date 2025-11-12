import {
  FaChartLine,
  FaUsers,
  FaShoppingCart,
  FaDollarSign,
} from "react-icons/fa";
import { MdTrendingUp, MdTrendingDown } from "react-icons/md";

const Analytics = () => {
  const stats = [
    {
      title: "Tổng doanh thu",
      value: "$45,230",
      change: "+12.5%",
      trend: "up",
      icon: <FaDollarSign />,
      color: "green",
    },
    {
      title: "Tổng đơn hàng",
      value: "1,234",
      change: "+8.2%",
      trend: "up",
      icon: <FaShoppingCart />,
      color: "blue",
    },
    {
      title: "Tổng người dùng",
      value: "892",
      change: "+15.3%",
      trend: "up",
      icon: <FaUsers />,
      color: "purple",
    },
    {
      title: "Tỷ lệ chuyển đổi",
      value: "3.24%",
      change: "-2.1%",
      trend: "down",
      icon: <FaChartLine />,
      color: "orange",
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Bảng điều khiển phân tích
        </h1>
        <p className="text-gray-600">
          Theo dõi hiệu suất và dữ liệu kinh doanh của bạn
        </p>
      </div>

      {/* Lưới thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-3 rounded-lg bg-${stat.color}-100 text-${stat.color}-600`}
              >
                {stat.icon}
              </div>
              <div
                className={`flex items-center gap-1 text-sm ${
                  stat.trend === "up" ? "text-green-600" : "text-red-600"
                }`}
              >
                {stat.trend === "up" ? <MdTrendingUp /> : <MdTrendingDown />}
                {stat.change}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
            </h3>
            <p className="text-gray-600 text-sm">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Khu vực biểu đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Biểu đồ doanh thu
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Biểu đồ sẽ được tích hợp tại đây</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Xu hướng đơn hàng
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Biểu đồ sẽ được tích hợp tại đây</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
