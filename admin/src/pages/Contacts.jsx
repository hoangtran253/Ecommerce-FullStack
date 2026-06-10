import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FaSync,
  FaTrash,
  FaEye,
  FaEnvelope,
  FaSearch,
  FaInbox,
  FaCheck,
  FaReply,
} from "react-icons/fa";
import Title from "../components/ui/title";
import UserAvatar from "../components/UserAvatar";
import SkeletonLoader from "../components/SkeletonLoader";
import { serverUrl } from "../../config";
import ConfirmModal from "../components/ConfirmModal";

const STATUS_LABELS = {
  unread: "Chưa đọc",
  read: "Đã đọc",
  replied: "Đã trả lời",
};

const STATUS_STYLES = {
  unread: "bg-amber-100 text-amber-800",
  read: "bg-blue-100 text-blue-800",
  replied: "bg-green-100 text-green-800",
};

const Contacts = () => {
  const { token } = useSelector((state) => state.auth);
  const [contacts, setContacts] = useState([]);
  const [counts, setCounts] = useState({ unread: 0, read: 0, replied: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [adminReply, setAdminReply] = useState("");
  const [statusEdit, setStatusEdit] = useState("unread");
  const [savingReply, setSavingReply] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });

  const headers = { Authorization: `Bearer ${token}` };

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: 100 });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await axios.get(
        `${serverUrl}/api/contact/admin/all?${params}`,
        { headers }
      );
      if (res.data.success) {
        setContacts(res.data.data || []);
        setCounts(res.data.counts || { total: 0, unread: 0, read: 0, replied: 0 });
      } else {
        toast.error(res.data.message || "Không tải được tin nhắn");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, search]);

  useEffect(() => {
    if (token) fetchContacts();
  }, [token, fetchContacts]);

  const markAsRead = async (id) => {
    try {
      await axios.put(
        `${serverUrl}/api/contact/admin/${id}/status`,
        { status: "read" },
        { headers }
      );
      fetchContacts();
    } catch {
      /* ignore */
    }
  };

  const openDetail = (contact) => {
    setSelected(contact);
    setAdminNotes(contact.adminNotes || "");
    setAdminReply(contact.adminReply || "");
    setStatusEdit(contact.status || "unread");
    if (contact.status === "unread") {
      markAsRead(contact._id);
      setSelected({ ...contact, status: "read" });
    }
  };

  const updateStatus = async (closeAfter = true) => {
    if (!selected) return;
    try {
      const res = await axios.put(
        `${serverUrl}/api/contact/admin/${selected._id}/status`,
        { status: statusEdit, adminNotes },
        { headers }
      );
      if (res.data.success) {
        toast.success("Cập nhật trạng thái thành công");
        fetchContacts();
        if (closeAfter) setSelected(null);
        else if (res.data.data) setSelected(res.data.data);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Cập nhật thất bại");
    }
  };

  const sendReply = async () => {
    if (!selected) return;
    if (!adminReply.trim()) {
      toast.error("Vui lòng nhập nội dung trả lời cho khách");
      return;
    }
    setSavingReply(true);
    try {
      const res = await axios.put(
        `${serverUrl}/api/contact/admin/${selected._id}/reply`,
        { adminReply: adminReply.trim() },
        { headers }
      );
      if (res.data.success) {
        toast.success(res.data.message || "Đã trả lời khách");
        const updated = res.data.data;
        setSelected(updated);
        setAdminReply(updated?.adminReply || adminReply.trim());
        setStatusEdit("replied");
        fetchContacts();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Gửi trả lời thất bại");
    } finally {
      setSavingReply(false);
    }
  };

  const openDeleteConfirm = (id) => setDeleteConfirm({ isOpen: true, id });

  const confirmDelete = async () => {
    const id = deleteConfirm.id;
    if (!id) return;
    try {
      const res = await axios.delete(`${serverUrl}/api/contact/admin/${id}`, {
        headers,
      });
      if (res.data.success) {
        toast.success("Đã xóa tin nhắn");
        if (selected?._id === id) setSelected(null);
        fetchContacts();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Xóa thất bại");
    } finally {
      setDeleteConfirm({ isOpen: false, id: null });
    }
  };

  const cancelDelete = () => setDeleteConfirm({ isOpen: false, id: null });

  if (loading && contacts.length === 0) {
    return (
      <div className="p-6">
        <SkeletonLoader type="dashboard" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Title>Tin nhắn liên hệ</Title>
          <p className="text-gray-600 mt-1">
            Quản lý tin nhắn khách gửi từ trang Liên hệ
          </p>
        </div>
        <button
          type="button"
          onClick={fetchContacts}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <FaSync /> Làm mới
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { key: "total", label: "Tổng", icon: FaInbox, style: "bg-gray-100" },
          { key: "unread", label: "Chưa đọc", icon: FaEnvelope, style: "bg-amber-50" },
          { key: "read", label: "Đã đọc", icon: FaEye, style: "bg-blue-50" },
          { key: "replied", label: "Đã trả lời", icon: FaCheck, style: "bg-green-50" },
        ].map(({ key, label, icon: Icon, style }) => (
          <div
            key={key}
            className={`${style} rounded-xl border border-gray-200 p-4`}
          >
            <Icon className="text-gray-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{counts[key] || 0}</p>
            <p className="text-sm text-gray-600">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Tìm tên, email, nội dung..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchContacts()}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="unread">Chưa đọc</option>
          <option value="read">Đã đọc</option>
          <option value="replied">Đã trả lời</option>
        </select>
        <button
          type="button"
          onClick={fetchContacts}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          Lọc
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Chủ đề</th>
                <th className="px-4 py-3">Tin nhắn</th>
                <th className="px-4 py-3">Ảnh</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Ngày</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    Chưa có tin nhắn
                  </td>
                </tr>
              ) : (
                contacts.map((c) => (
                  <tr
                    key={c._id}
                    className={`hover:bg-gray-50 ${
                      c.status === "unread" ? "bg-amber-50/40" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          src={c.userId?.avatar}
                          name={c.name}
                          email={c.email}
                          size={32}
                        />
                        <div>
                          <p className="font-medium text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[140px] truncate">
                      {c.subject || "—"}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-gray-600">
                      {c.message}
                    </td>
                    <td className="px-4 py-3">
                      {c.images?.length > 0 ? (
                        <div className="flex -space-x-2">
                          {c.images.slice(0, 3).map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt=""
                              className="w-9 h-9 rounded border-2 border-white object-cover"
                            />
                          ))}
                          {c.images.length > 3 && (
                            <span className="w-9 h-9 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs text-gray-600">
                              +{c.images.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          STATUS_STYLES[c.status] || STATUS_STYLES.unread
                        }`}
                      >
                        {STATUS_LABELS[c.status] || c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openDetail(c)}
                        className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Xem"
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteConfirm(c._id)}
                        className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors ml-1"
                        title="Xóa"
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

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-auto">
            <div className="p-6 border-b flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{selected.name}</h3>
                <p className="text-sm text-gray-500">{selected.email}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(selected.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                  Chủ đề
                </p>
                <p className="text-gray-900">{selected.subject}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                  Tin nhắn
                </p>
                <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border">
                  {selected.message}
                </p>
              </div>
              {selected.images?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                    Ảnh mô tả ({selected.images.length})
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selected.images.map((img, idx) => (
                      <a
                        key={idx}
                        href={img}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-square rounded-lg overflow-hidden border border-gray-200 hover:ring-2 hover:ring-blue-400"
                      >
                        <img
                          src={img}
                          alt={`Ảnh ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Trả lời khách (hiển thị trên trang Liên hệ)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Khách sẽ thấy trong tab &quot;Shop đã trả lời&quot;
                </p>
                {selected.adminReply && selected.repliedAt && (
                  <p className="text-xs text-green-700 mb-2">
                    Đã trả lời lúc{" "}
                    {new Date(selected.repliedAt).toLocaleString("vi-VN")}
                  </p>
                )}
                <textarea
                  rows={4}
                  value={adminReply}
                  onChange={(e) => setAdminReply(e.target.value)}
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập câu trả lời cho khách hàng..."
                />
                <button
                  type="button"
                  onClick={sendReply}
                  disabled={savingReply}
                  className="mt-2 w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  <FaReply />
                  {savingReply ? "Đang gửi..." : "Gửi trả lời cho khách"}
                </button>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Trạng thái xử lý
                  </label>
                  <select
                    value={statusEdit}
                    onChange={(e) => setStatusEdit(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="unread">Chưa đọc</option>
                    <option value="read">Đã đọc</option>
                    <option value="replied">Đã trả lời</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Ghi chú nội bộ (chỉ admin)
                  </label>
                  <textarea
                    rows={2}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Ghi chú nội bộ, khách không thấy..."
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="flex-1 py-2 border rounded-lg text-sm"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus(true)}
                  className="flex-1 py-2 bg-gray-900 text-white rounded-lg text-sm"
                >
                  Lưu trạng thái
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
