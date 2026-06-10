import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Title from "../components/ui/title";
import PriceFormat from "../components/PriceFormat";
import SkeletonLoader from "../components/SkeletonLoader";
import UserAvatar from "../components/UserAvatar";
import OrderItemsList from "../components/OrderItemsList";
import ConfirmModal from "../components/ConfirmModal";
import { serverUrl } from "../../config";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  getOrderCustomerName,
  getItemProductName,
  formatOrderDateTime,
  getOrderDateValue,
} from "../utils/dashboard";
import {
  FaEdit,
  FaTrash,
  FaSearch,
  FaCalendarAlt,
  FaShoppingBag,
  FaCreditCard,
  FaMoneyBillWave,
  FaClock,
  FaCheckCircle,
  FaTruck,
  FaBox,
  FaTimes,
  FaSort,
  FaSync,
} from "react-icons/fa";
import { IoMdClose } from "react-icons/io";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [editingOrder, setEditingOrder] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newPaymentStatus, setNewPaymentStatus] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, orderId: "" });
  const [isDeleting, setIsDeleting] = useState(false);

  const statusOptions = [
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
  ];
  const paymentStatusOptions = ["pending", "paid", "failed"];

  // Fetch all orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${serverUrl}/api/order/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      } else {
        toast.error(data.message || "Không thể tải đơn hàng");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId, status, paymentStatus = null) => {
    try {
      const token = localStorage.getItem("token");
      const updateData = { orderId, status };

      if (paymentStatus) {
        updateData.paymentStatus = paymentStatus;
      }

      const response = await fetch(`${serverUrl}/api/order/update-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message || "Cập nhật đơn hàng thành công");
        fetchOrders(); // Refresh orders
        setShowEditModal(false);
        setEditingOrder(null);
      } else {
        toast.error(data.message || "Cập nhật thất bại");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Cập nhật đơn hàng thất bại");
    }
  };

  // Delete order
  const deleteOrder = async (orderId) => {
    setDeleteConfirm({ isOpen: true, id: orderId, orderId: `#${orderId.slice(-8).toUpperCase()}` });
  };

  const confirmDeleteOrder = async () => {
    const orderId = deleteConfirm.id;
    if (!orderId) return;

    try {
      setIsDeleting(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${serverUrl}/api/order/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Đã xóa đơn hàng");
        fetchOrders(); // Refresh orders
      } else {
        toast.error(data.message || "Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
    } finally {
      setIsDeleting(false);
      setDeleteConfirm({ isOpen: false, id: null, orderId: "" });
    }
  };

  const cancelDeleteOrder = () => {
    setDeleteConfirm({ isOpen: false, id: null, orderId: "" });
  };

  // Handle edit order
  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setNewStatus(order.status);
    setNewPaymentStatus(order.paymentStatus);
    setShowEditModal(true);
  };

  // Handle save changes
  const handleSaveChanges = () => {
    if (editingOrder) {
      updateOrderStatus(editingOrder._id, newStatus, newPaymentStatus);
    }
  };

  // Filter and sort orders
  const filteredOrders = orders
    .filter((order) => {
      const customerName = getOrderCustomerName(order).toLowerCase();
      const productNames = (order.items || [])
        .map(getItemProductName)
        .join(" ")
        .toLowerCase();
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        order._id.toLowerCase().includes(q) ||
        customerName.includes(q) ||
        order.userId?.email?.toLowerCase().includes(q) ||
        order.address?.email?.toLowerCase().includes(q) ||
        productNames.includes(q);

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      const matchesPayment =
        paymentFilter === "all" || order.paymentStatus === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "date":
          aValue = getOrderDateValue(a) || new Date(0);
          bValue = getOrderDateValue(b) || new Date(0);
          break;
        case "amount":
          aValue = a.amount;
          bValue = b.amount;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.date;
          bValue = b.date;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "shipped":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FaClock className="w-3 h-3" />;
      case "confirmed":
        return <FaCheckCircle className="w-3 h-3" />;
      case "shipped":
        return <FaTruck className="w-3 h-3" />;
      case "delivered":
        return <FaBox className="w-3 h-3" />;
      case "cancelled":
        return <FaTimes className="w-3 h-3" />;
      default:
        return <FaClock className="w-3 h-3" />;
    }
  };

  // Get payment status color
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const activeOrders = orders.filter((o) => o.status !== "cancelled");
  const paidOrders = orders.filter((o) => o.paymentStatus === "paid" && o.status !== "cancelled");
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const totalUnits = activeOrders.reduce(
    (sum, o) =>
      sum + (o.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0),
    0
  );

  if (loading) {
    return (
      <div>
        <Title>Quản lý đơn hàng</Title>
        <div className="mt-6">
          <SkeletonLoader type="orders" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Title>Quản lý đơn hàng</Title>
          <p className="text-gray-600 mt-1">
            Xem và quản lý tất cả đơn hàng của khách hàng
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          title="Làm mới"
        >
          <FaSync className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">
                Tổng đơn (không hủy)
              </p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {activeOrders.length}
              </p>
            </div>
            <FaShoppingBag className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">
                Đang chờ
              </p>
              <p className="text-xl lg:text-2xl font-bold text-yellow-600">
                {orders.filter((o) => o.status === "pending").length}
              </p>
            </div>
            <FaClock className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">
                Đã giao
              </p>
              <p className="text-xl lg:text-2xl font-bold text-green-600">
                {orders.filter((o) => o.status === "delivered").length}
              </p>
            </div>
            <FaBox className="w-6 h-6 lg:w-8 lg:h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">
                Doanh thu
              </p>
              <p className="text-xl lg:text-2xl font-bold text-purple-600">
                <PriceFormat amount={totalRevenue} />
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {totalUnits.toLocaleString("vi-VN")} SP đã bán
              </p>
            </div>
            <FaCreditCard className="w-6 h-6 lg:w-8 lg:h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm đơn hàng, khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>

          {/* Payment Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="all">Tất cả thanh toán</option>
            {paymentStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>

          {/* Sort */}
          <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="date">Sắp xếp: Ngày</option>
              <option value="amount">Sắp xếp: Số tiền</option>
              <option value="status">Sắp xếp: Trạng thái</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
            >
              <FaSort className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table - Desktop */}
      <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã đơn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày đặt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thanh toán
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      #{order._id.slice(-8).toUpperCase()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <UserAvatar
                          src={order.userId?.avatar}
                          name={getOrderCustomerName(order)}
                          email={order.userId?.email}
                          size={32}
                        />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {getOrderCustomerName(order)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.userId?.email || "N/A"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-start text-sm text-gray-900">
                      <FaCalendarAlt className="w-4 h-4 mr-2 text-gray-400 mt-0.5 shrink-0" />
                      <span className="leading-snug">
                        {formatOrderDateTime(order)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top min-w-[200px] max-w-md">
                    <OrderItemsList items={order.items} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      <PriceFormat amount={order.amount} />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusIcon(order.status)}
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                          order.paymentStatus
                        )}`}
                      >
                        {order.paymentMethod === "cod" ? (
                          <FaMoneyBillWave className="w-3 h-3" />
                        ) : (
                          <FaCreditCard className="w-3 h-3" />
                        )}
                        {PAYMENT_STATUS_LABELS[order.paymentStatus] ||
                          order.paymentStatus}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEditOrder(order)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="Edit Order"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteOrder(order._id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="Delete Order"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <FaShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không tìm thấy đơn hàng
            </h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "all" || paymentFilter !== "all"
                ? "Thử đổi bộ lọc hoặc từ khóa tìm kiếm"
                : "Chưa có đơn hàng nào"}
            </p>
          </div>
        )}
      </div>

      {/* Orders Cards - Mobile/Tablet */}
      <div className="lg:hidden space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <FaShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không tìm thấy đơn hàng
            </h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "all" || paymentFilter !== "all"
                ? "Thử đổi bộ lọc hoặc từ khóa tìm kiếm"
                : "Chưa có đơn hàng nào"}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <UserAvatar
                    src={order.userId?.avatar}
                    name={getOrderCustomerName(order)}
                    email={order.userId?.email}
                    size={40}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      #{order._id.slice(-8).toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.userId?.name || "N/A"}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditOrder(order)}
                    className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"
                    title="Edit Order"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteOrder(order._id)}
                    className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
                    title="Delete Order"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-3">
                <div className="text-sm text-gray-600 mb-1">Customer Email</div>
                <div className="text-sm font-medium text-gray-900">
                  {order.userId?.email || "N/A"}
                </div>
              </div>

              {/* Order Details */}
              <div className="space-y-3 mb-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Ngày đặt</div>
                  <div className="flex items-start text-sm text-gray-900">
                    <FaCalendarAlt className="w-3 h-3 mr-1 text-gray-400 mt-0.5 shrink-0" />
                    <span>{formatOrderDateTime(order)}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Sản phẩm</div>
                  <OrderItemsList items={order.items} compact />
                </div>
              </div>

              {/* Amount */}
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">Amount</div>
                <div className="text-lg font-bold text-gray-900">
                  <PriceFormat amount={order.amount} />
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                    order.status
                  )}`}
                >
                  {getStatusIcon(order.status)}
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                    order.paymentStatus
                  )}`}
                >
                  {order.paymentMethod === "cod" ? (
                    <FaMoneyBillWave className="w-3 h-3" />
                  ) : (
                    <FaCreditCard className="w-3 h-3" />
                  )}
                  {order.paymentStatus.charAt(0).toUpperCase() +
                    order.paymentStatus.slice(1)}
                </span>
              </div>

              {/* Payment Method */}
              <div className="text-xs text-gray-500">
                Payment Method: {order.paymentMethod?.toUpperCase() || "N/A"}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Chỉnh sửa đơn hàng
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingOrder(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <IoMdClose size={24} />
                </button>
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">
                  Order #{editingOrder._id.slice(-8).toUpperCase()}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái đơn hàng
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái thanh toán
                </label>
                <select
                  value={newPaymentStatus}
                  onChange={(e) => setNewPaymentStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {paymentStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSaveChanges}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingOrder(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteConfirm.isOpen}
        title="Xóa đơn hàng"
        message={`Bạn có chắc muốn xóa đơn hàng ${deleteConfirm.orderId}? Hành động này không thể hoàn tác.`}
        onCancel={cancelDeleteOrder}
        onConfirm={confirmDeleteOrder}
        confirmLabel="Xóa đơn hàng"
        cancelLabel="Hủy"
        isLoading={isDeleting}
        type="danger"
      />
    </div>
  );
};

export default Orders;
