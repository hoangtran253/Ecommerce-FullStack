import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  FaFileInvoice,
  FaPrint,
  FaSearch,
  FaSync,
} from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import Title from "../components/ui/title";
import PriceFormat from "../components/PriceFormat";
import SkeletonLoader from "../components/SkeletonLoader";
import UserAvatar from "../components/UserAvatar";
import { serverUrl } from "../../config";
import {
  formatDate,
  getOrderCustomerName,
  getOrderDisplayAmount,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "../utils/dashboard";

const PAYMENT_METHOD_LABELS = {
  cod: "Thanh toán khi nhận (COD)",
  stripe: "Thẻ / Stripe",
  paypal: "PayPal",
};

const getItemImage = (item) => {
  const fromProduct =
    item.productId?.image?.[0] ||
    item.productId?.images?.[0] ||
    (Array.isArray(item.productId?.image)
      ? item.productId.image[0]
      : item.productId?.image);
  return item.image || fromProduct || "";
};

const formatAddress = (addr) => {
  if (!addr) return "—";
  const name = [addr.firstName, addr.lastName].filter(Boolean).join(" ");
  const lines = [
    name,
    addr.street,
    [addr.city, addr.state, addr.zipcode].filter(Boolean).join(", "),
    addr.country,
    addr.phone && `ĐT: ${addr.phone}`,
    addr.email,
  ].filter(Boolean);
  return lines;
};

const Invoice = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${serverUrl}/api/order/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        toast.error(data.message || "Không tải được đơn hàng");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((order) => {
      const id = order._id?.toLowerCase() || "";
      const name = getOrderCustomerName(order).toLowerCase();
      const email =
        order.userId?.email?.toLowerCase() ||
        order.address?.email?.toLowerCase() ||
        "";
      return id.includes(q) || name.includes(q) || email.includes(q);
    });
  }, [orders, searchTerm]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonLoader type="dashboard" />
      </div>
    );
  }

  const invoiceTotal = selectedOrder
    ? getOrderDisplayAmount(selectedOrder)
    : 0;

  return (
    <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <Title>Quản lý hóa đơn</Title>
          <p className="text-gray-600 mt-1">Xem chi tiết và in hóa đơn từ đơn hàng đã đặt</p>
          <p className="text-gray-600 mt-1">
            Tổng hóa đơn (đang có): <span className="font-semibold">{filteredOrders.length}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <FaSync /> Làm mới
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 print:hidden">
        <div className="relative max-w-md">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Tìm mã đơn, tên hoặc email khách..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Mã đơn</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Ngày</th>
                <th className="px-4 py-3">Tổng</th>
                <th className="px-4 py-3">Thanh toán</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    Không có đơn hàng
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      #{order._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          src={order.userId?.avatar}
                          name={getOrderCustomerName(order)}
                          email={order.userId?.email}
                          size={28}
                        />
                        <span>{getOrderCustomerName(order)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(order.date)}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      <PriceFormat amount={getOrderDisplayAmount(order)} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          order.paymentStatus === "paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {PAYMENT_STATUS_LABELS[order.paymentStatus] ||
                          order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium"
                      >
                        <FaFileInvoice /> Xem HĐ
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 overflow-y-auto print:relative print:inset-auto print:bg-white print:p-0">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8 print:shadow-none print:max-w-none print:my-0">
            <div className="flex items-center justify-between px-6 py-4 border-b print:hidden">
              <h2 className="text-lg font-semibold">Chi tiết hóa đơn</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm"
                >
                  <FaPrint /> In hóa đơn
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <IoMdClose size={24} />
                </button>
              </div>
            </div>

            <div id="invoice-print" className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-4 border-b pb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">HÓA ĐƠN</h1>
                  <p className="text-gray-500 text-sm mt-1">OREBI Admin</p>
                </div>
                <div className="text-sm text-gray-600 sm:text-right">
                  <p>
                    <span className="font-medium text-gray-900">Mã HĐ:</span> #
                    {selectedOrder._id.slice(-8).toUpperCase()}
                  </p>
                  <p>
                    <span className="font-medium text-gray-900">Ngày:</span>{" "}
                    {formatDate(selectedOrder.date)}
                  </p>
                  <p>
                    <span className="font-medium text-gray-900">Trạng thái:</span>{" "}
                    {ORDER_STATUS_LABELS[selectedOrder.status] ||
                      selectedOrder.status}
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-xs font-semibold uppercase text-gray-500 mb-3">
                    Khách hàng
                  </h3>
                  <div className="flex items-center gap-3 mb-3">
                    <UserAvatar
                      src={selectedOrder.userId?.avatar}
                      name={getOrderCustomerName(selectedOrder)}
                      email={selectedOrder.userId?.email}
                      size={40}
                    />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {getOrderCustomerName(selectedOrder)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedOrder.userId?.email ||
                          selectedOrder.address?.email ||
                          "—"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-xs font-semibold uppercase text-gray-500 mb-3">
                    Địa chỉ giao hàng
                  </h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    {formatAddress(selectedOrder.address).map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase text-gray-500 mb-3">
                  Chi tiết sản phẩm
                </h3>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-4 py-2 text-left">Sản phẩm</th>
                        <th className="px-4 py-2 text-center">SL</th>
                        <th className="px-4 py-2 text-right">Đơn giá</th>
                        <th className="px-4 py-2 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(selectedOrder.items || []).map((item, idx) => {
                        const qty = Number(item.quantity) || 1;
                        const price = Number(item.price) || 0;
                        const lineTotal = price * qty;
                        const img = getItemImage(item);
                        return (
                          <tr key={idx}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {img ? (
                                  <img
                                    src={img}
                                    alt={item.name}
                                    className="w-12 h-12 rounded-lg object-cover border"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-gray-100 border" />
                                )}
                                <span className="font-medium text-gray-900">
                                  {item.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">{qty}</td>
                            <td className="px-4 py-3 text-right">
                              <PriceFormat amount={price} />
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              <PriceFormat amount={lineTotal} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between gap-4 pt-4 border-t">
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium text-gray-900">
                      Phương thức:
                    </span>{" "}
                    {PAYMENT_METHOD_LABELS[selectedOrder.paymentMethod] ||
                      selectedOrder.paymentMethod}
                  </p>
                  <p>
                    <span className="font-medium text-gray-900">
                      Thanh toán:
                    </span>{" "}
                    {PAYMENT_STATUS_LABELS[selectedOrder.paymentStatus] ||
                      selectedOrder.paymentStatus}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Tổng thanh toán</p>
                  <p className="text-2xl font-bold text-gray-900">
                    <PriceFormat amount={invoiceTotal} />
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-400 text-center pt-4 border-t print:mt-8">
                Cảm ơn quý khách đã mua hàng tại OREBI
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print, #invoice-print * { visibility: visible; }
          #invoice-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Invoice;
