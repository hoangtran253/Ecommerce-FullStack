import { useEffect, useState, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaImage,
  FaTimes,
  FaPaperPlane,
  FaInbox,
  FaCheckCircle,
  FaStore,
} from "react-icons/fa";
import Container from "../components/Container";
import { serverUrl } from "../../config";

const MAX_IMAGES = 5;

const formatDate = (d) =>
  new Date(d).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const MessageCard = ({ item, showReply = false }) => (
  <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-3">
    <div className="flex justify-between items-start gap-2">
      <p className="text-xs text-gray-500">{formatDate(item.createdAt)}</p>
      <span
        className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
          item.status === "replied" && item.adminReply
            ? "bg-green-100 text-green-800"
            : item.status === "read"
              ? "bg-blue-100 text-blue-800"
              : "bg-amber-100 text-amber-800"
        }`}
      >
        {item.status === "replied" && item.adminReply
          ? "Shop đã trả lời"
          : item.status === "read"
            ? "Đã xem"
            : "Đang chờ phản hồi"}
      </span>
    </div>
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
      <p className="text-xs font-medium text-gray-500 mb-1">Bạn đã gửi</p>
      <p className="text-gray-800 whitespace-pre-wrap text-sm">{item.message}</p>
      {item.images?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {item.images.map((img, i) => (
            <a key={i} href={img} target="_blank" rel="noopener noreferrer">
              <img
                src={img}
                alt=""
                className="w-16 h-16 object-cover rounded-lg border"
              />
            </a>
          ))}
        </div>
      )}
    </div>
    {showReply && item.adminReply && (
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
        <p className="text-xs font-medium text-blue-800 mb-1 flex items-center gap-1">
          <FaStore className="text-sm" /> OREBI đã trả lời
          {item.repliedAt && (
            <span className="text-blue-600 font-normal">
              · {formatDate(item.repliedAt)}
            </span>
          )}
        </p>
        <p className="text-gray-800 whitespace-pre-wrap text-sm">
          {item.adminReply}
        </p>
      </div>
    )}
  </div>
);

const Contact = () => {
  const userInfo = useSelector((state) => state.orebiReducer?.userInfo);
  const isLoggedIn = Boolean(userInfo);
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("send");
  const [info, setInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sentMessages, setSentMessages] = useState([]);
  const [repliedMessages, setRepliedMessages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const loadMyMessages = useCallback(async () => {
    if (!isLoggedIn) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoadingMessages(true);
    try {
      const res = await fetch(`${serverUrl}/api/contact/my-contacts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSentMessages(data.sent || []);
        setRepliedMessages(data.replied || []);
      } else {
        toast.error(data.message || "Không tải được tin nhắn");
      }
    } catch {
      toast.error("Không kết nối được máy chủ");
    } finally {
      setLoadingMessages(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetch(`${serverUrl}/api/contact/info`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setInfo(data.info);
      })
      .catch(() => toast.error("Không tải được thông tin liên hệ"))
      .finally(() => setLoadingInfo(false));
  }, []);

  useEffect(() => {
    if (userInfo) {
      setForm((f) => ({
        ...f,
        name: userInfo.name || "",
        email: userInfo.email || "",
      }));
      loadMyMessages();
    }
  }, [userInfo, loadMyMessages]);

  useEffect(() => {
    if (
      (activeTab === "sent" || activeTab === "replied") &&
      isLoggedIn
    ) {
      loadMyMessages();
    }
  }, [activeTab, isLoggedIn, loadMyMessages]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, [imagePreviews]);

  const handleChange = (e) => {
    const { name } = e.target;
    if (isLoggedIn && (name === "email" || name === "name")) return;
    setForm((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const handleImagePick = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = MAX_IMAGES - imageFiles.length;
    if (remaining <= 0) {
      toast.error(`Tối đa ${MAX_IMAGES} ảnh`);
      return;
    }
    const toAdd = files.slice(0, remaining);
    if (toAdd.some((f) => !f.type.startsWith("image/"))) {
      toast.error("Chỉ chấp nhận file ảnh");
      return;
    }
    setImageFiles((prev) => [...prev, ...toAdd]);
    setImagePreviews((prev) => [
      ...prev,
      ...toAdd.map((f) => URL.createObjectURL(f)),
    ]);
    e.target.value = "";
  };

  const removeImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      const url = prev[index];
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const resetForm = () => {
    setForm({
      name: isLoggedIn ? userInfo?.name || "" : "",
      email: isLoggedIn ? userInfo?.email || "" : "",
      message: "",
    });
    imagePreviews.forEach((url) => {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    });
    setImageFiles([]);
    setImagePreviews([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nameSend = isLoggedIn ? userInfo.name : form.name.trim();
    const emailSend = isLoggedIn ? userInfo.email : form.email.trim();

    if (!nameSend || !emailSend || !form.message.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const body = new FormData();
      body.append("name", nameSend);
      body.append("email", emailSend);
      body.append("message", form.message.trim());
      imageFiles.forEach((file) => body.append("images", file));

      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${serverUrl}/api/contact`, {
        method: "POST",
        headers,
        body,
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        resetForm();
        loadMyMessages();
        setActiveTab("sent");
      } else {
        toast.error(data.message || "Gửi tin nhắn thất bại");
      }
    } catch {
      toast.error("Không thể gửi tin nhắn");
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: "send", label: "Gửi tin nhắn", icon: FaPaperPlane },
    { id: "sent", label: "Tin đã gửi", icon: FaInbox, count: sentMessages.length },
    {
      id: "replied",
      label: "Shop đã trả lời",
      icon: FaCheckCircle,
      count: repliedMessages.length,
    },
  ];

  const StoreInfoPanel = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8 h-fit">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        Thông tin cửa hàng
      </h2>
      {loadingInfo ? (
        <p className="text-gray-500 text-sm">Đang tải...</p>
      ) : (
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <FaPhone className="text-blue-600 mt-1" />
            <div>
              <p className="text-xs text-gray-500">Điện thoại</p>
              <p className="font-medium">{info?.displayPhone || info?.phone}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FaEnvelope className="text-blue-600 mt-1" />
            <div>
              <p className="text-xs text-gray-500">Email cửa hàng</p>
              <p className="font-medium break-all">{info?.email}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FaMapMarkerAlt className="text-blue-600 mt-1" />
            <div>
              <p className="text-xs text-gray-500">Địa chỉ</p>
              <p className="font-medium">{info?.address}</p>
            </div>
          </div>
          {info?.mapEmbedUrl && (
            <div className="rounded-xl overflow-hidden border aspect-video">
              <iframe
                title="Bản đồ"
                src={info.mapEmbedUrl}
                className="w-full h-full min-h-[200px] border-0 pointer-events-none"
                loading="lazy"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );

  const LoginPrompt = () => (
    <div className="bg-white rounded-xl border p-8 text-center">
      <p className="text-gray-600 mb-4">
        Đăng nhập để xem tin nhắn đã gửi và phản hồi từ shop
      </p>
      <Link
        to="/signin"
        state={{ from: "/contact" }}
        className="inline-block px-6 py-2 bg-gray-900 text-white rounded-lg text-sm"
      >
        Đăng nhập
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <Container className="py-6">
          <h1 className="text-3xl font-bold text-gray-900">Liên hệ</h1>
          <p className="text-gray-600 mt-1">
            Gửi tin nhắn và theo dõi phản hồi từ OREBI
          </p>
        </Container>
      </div>

      <Container className="py-8">
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-1">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <Icon />
              {label}
              {count != null && count > 0 && (
                <span className="bg-gray-200 text-gray-700 text-xs px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "send" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl border shadow-sm p-6 md:p-8">
              <h2 className="text-xl font-semibold mb-2">Gửi tin nhắn mới</h2>
              <p className="text-sm text-gray-500 mb-6">
                {isLoggedIn
                  ? "Họ tên và email lấy từ tài khoản, không thể đổi."
                  : "Nhập thông tin liên hệ của bạn."}
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={isLoggedIn ? userInfo.name : form.name}
                    onChange={handleChange}
                    readOnly={isLoggedIn}
                    disabled={isLoggedIn}
                    className={`w-full px-4 py-3 border rounded-lg ${
                      isLoggedIn
                        ? "bg-gray-100 text-gray-600 cursor-not-allowed border-gray-200"
                        : "border-gray-300 focus:ring-2 focus:ring-blue-600"
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={isLoggedIn ? userInfo.email : form.email}
                    onChange={handleChange}
                    readOnly={isLoggedIn}
                    disabled={isLoggedIn}
                    className={`w-full px-4 py-3 border rounded-lg ${
                      isLoggedIn
                        ? "bg-gray-100 text-gray-600 cursor-not-allowed border-gray-200"
                        : "border-gray-300 focus:ring-2 focus:ring-blue-600"
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tin nhắn
                  </label>
                  <textarea
                    name="message"
                    rows={4}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Viết lời nhắn..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ảnh mô tả (tối đa {MAX_IMAGES})
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImagePick}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageFiles.length >= MAX_IMAGES}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    <FaImage /> Chọn ảnh
                  </button>
                  {imagePreviews.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {imagePreviews.map((src, idx) => (
                        <div key={src} className="relative w-16 h-16">
                          <img
                            src={src}
                            alt=""
                            className="w-full h-full object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Đang gửi..." : "Gửi tin nhắn"}
                </button>
              </form>
            </div>
            <StoreInfoPanel />
          </div>
        )}

        {activeTab === "sent" && (
          <div className="max-w-3xl mx-auto space-y-4">
            {!isLoggedIn ? (
              <LoginPrompt />
            ) : (
              <>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={loadMyMessages}
                    disabled={loadingMessages}
                    className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                  >
                    {loadingMessages ? "Đang tải..." : "Làm mới"}
                  </button>
                </div>
                {loadingMessages && sentMessages.length === 0 ? (
                  <p className="text-center text-gray-500 py-12">Đang tải...</p>
                ) : sentMessages.length === 0 ? (
                  <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
                    Chưa có tin nhắn đang chờ phản hồi
                  </div>
                ) : (
                  sentMessages.map((item) => (
                    <MessageCard key={item._id} item={item} />
                  ))
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "replied" && (
          <div className="max-w-3xl mx-auto space-y-4">
            {!isLoggedIn ? (
              <LoginPrompt />
            ) : (
              <>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={loadMyMessages}
                    disabled={loadingMessages}
                    className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                  >
                    {loadingMessages ? "Đang tải..." : "Làm mới"}
                  </button>
                </div>
                {loadingMessages && repliedMessages.length === 0 ? (
                  <p className="text-center text-gray-500 py-12">Đang tải...</p>
                ) : repliedMessages.length === 0 ? (
                  <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
                    Shop chưa trả lời tin nhắn nào. 
                  </div>
                ) : (
                  repliedMessages.map((item) => (
                    <MessageCard key={item._id} item={item} showReply />
                  ))
                )}
              </>
            )}
          </div>
        )}
      </Container>
    </div>
  );
};

export default Contact;
