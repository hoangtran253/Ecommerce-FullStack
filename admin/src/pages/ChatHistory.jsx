import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import Container from "../components/Container";
import Title from "../components/ui/title";
import {
  FaSearch,
  FaSync,
  FaUser,
  FaComment,
  FaClock,
  FaTrash,
} from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import ConfirmModal from "../components/ConfirmModal";

const ChatHistory = () => {
  const { token } = useSelector((state) => state.auth);
  const [histories, setHistories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, userId: null });

  const fetchHistories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/chat-history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      if (data.success) {
        setHistories(data.data);
      } else {
        toast.error(data.message || "Không thể tải lịch sử chat");
      }
    } catch (error) {
      console.error("Lỗi khi tải lịch sử chat:", error);
      toast.error("Không thể tải lịch sử chat");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/chat-history/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Lỗi khi tải thống kê:", error);
    }
  }, [token]);

  useEffect(() => {
    fetchHistories();
    fetchStats();
  }, [fetchHistories, fetchStats]);

  const openDetailModal = (history) => {
    setSelectedHistory(history);
    setShowDetailModal(true);
  };

  const openDeleteConfirm = (id, userId) => {
    setDeleteConfirm({ isOpen: true, id, userId });
  };

  const confirmDelete = async () => {
    const historyId = deleteConfirm.id;
    if (!historyId) return;

    try {
      setDeleting(true);
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/chat-history/${historyId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Đã xóa lịch sử chat thành công");
        fetchHistories();
        fetchStats();
      } else {
        toast.error(data.message || "Không thể xóa lịch sử chat");
      }
    } catch (error) {
      console.error("Lỗi khi xóa lịch sử chat:", error);
      toast.error("Không thể xóa lịch sử chat");
    } finally {
      setDeleting(false);
      setDeleteConfirm({ isOpen: false, id: null, userId: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, id: null, userId: null });
  };

  const clearUserHistory = async (userId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/chat-history/user/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(`Đã xóa ${data.deletedCount} bản ghi chat của user này`);
        fetchHistories();
        fetchStats();
      } else {
        toast.error(data.message || "Không thể xóa lịch sử chat");
      }
    } catch (error) {
      console.error("Lỗi khi xóa lịch sử chat:", error);
      toast.error("Không thể xóa lịch sử chat");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN");
  };

  const filteredHistories = histories.filter((history) => {
    const searchLower = searchTerm.toLowerCase();
    const userName = history.userId?.name || "";
    const userEmail = history.userId?.email || "";
    return (
      userName.toLowerCase().includes(searchLower) ||
      userEmail.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <Container>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Title>Lịch sử Chat</Title>
            <p className="text-gray-600 mt-1">Quản lý lịch sử chat của khách hàng</p>
          </div>
          <button
            onClick={() => {
              fetchHistories();
              fetchStats();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <FaSync />
            Làm mới
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FaComment className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tổng cuộc chat</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalHistories}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FaUser className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tổng tin nhắn</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FaClock className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">User hoạt động nhiều nhất</p>
                  <p className="text-lg font-bold text-gray-900">
                    {stats.topUsers?.[0]?.user?.[0]?.name || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số tin nhắn</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lần hoạt động gần nhất</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredHistories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                      {searchTerm
                        ? "Không tìm thấy lịch sử chat nào"
                        : "Chưa có lịch sử chat nào"}
                    </td>
                  </tr>
                ) : (
                  filteredHistories.map((history) => (
                    <tr key={history._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {history.userId?.name || "Unknown"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {history.userId?.email || ""}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {history.messages?.length || 0}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(history.lastUpdated)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openDetailModal(history)}
                          className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          Xem chi tiết
                        </button>

                        <button
                          onClick={() => openDeleteConfirm(history._id, history.userId?._id)}
                          className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors ml-1"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showDetailModal && selectedHistory && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Chi tiết Chat</h2>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedHistory(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <IoMdClose size={24} />
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <p><strong>User:</strong> {selectedHistory.userId?.name} ({selectedHistory.userId?.email})</p>
                  <p><strong>Lần hoạt động gần nhất:</strong> {formatDate(selectedHistory.lastUpdated)}</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {selectedHistory.messages?.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm font-medium mb-1">
                        {msg.role === "user" ? "Bạn" : "Bot"}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {msg.products && msg.products.length > 0 && (
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {msg.products.map((product) => (
                            <div
                              key={product.id}
                              className="text-xs bg-white/20 rounded px-2 py-1"
                            >
                              {product.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={() => clearUserHistory(selectedHistory.userId?._id)}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Xóa tất cả lịch sử chat của user này
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmModal
          open={deleteConfirm.isOpen}
          title="Xóa lịch sử chat"
          message="Bạn có chắc muốn xóa lịch sử chat này? Hành động này không thể hoàn tác."
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
          confirmLabel="Xóa"
          cancelLabel="Hủy"
          isLoading={deleting}
          type="danger"
        />
      </div>
    </Container>
  );
};

export default ChatHistory;
