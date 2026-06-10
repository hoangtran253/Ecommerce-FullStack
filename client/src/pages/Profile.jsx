import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { serverUrl } from "../../config";
import { addUser } from "../redux/orebiSlice";
import { logoutSession } from "../utils/logoutSession";
import Container from "../components/Container";
import {
  FaSignOutAlt,
  FaUserCircle,
  FaSave,
  FaShoppingBag,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCamera,
} from "react-icons/fa";

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userInfo = useSelector((state) => state.orebiReducer.userInfo);
  const orderCount = useSelector((state) => state.orebiReducer.orderCount);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const applyUserToForm = (user) => {
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
    });
  };

  const fetchUserProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${serverUrl}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const userData = response.data.user;
        dispatch(
          addUser({
            id: userData.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            phone: userData.phone,
            address: userData.address,
            avatar: userData.avatar,
          })
        );
        applyUserToForm(userData);
        setAvatarPreview(userData.avatar || "");
      } else {
        toast.error(response.data.message || "Không thể tải hồ sơ");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Không thể tải thông tin hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh phải nhỏ hơn 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp hình ảnh");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);

    setUploadingAvatar(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await axios.post(
        `${serverUrl}/api/user/profile/avatar`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const updated = response.data.user;
        dispatch(
          addUser({
            id: updated.id || userInfo?.id,
            name: updated.name,
            email: updated.email,
            role: updated.role || userInfo?.role,
            phone: updated.phone,
            address: updated.address,
            avatar: updated.avatar,
          })
        );
        setAvatarPreview(updated.avatar);
        toast.success("Cập nhật ảnh đại diện thành công");
      } else {
        toast.error(response.data.message || "Tải ảnh thất bại");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Tải ảnh đại diện thất bại"
      );
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Vui lòng nhập họ tên");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${serverUrl}/api/user/profile`,
        {
          name: form.name,
          phone: form.phone,
          address: form.address,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        const updated = response.data.user;
        dispatch(
          addUser({
            id: updated.id || userInfo?.id,
            name: updated.name,
            email: updated.email,
            role: updated.role || userInfo?.role,
            phone: updated.phone,
            address: updated.address,
            avatar: updated.avatar ?? userInfo?.avatar,
          })
        );
        applyUserToForm(updated);
        setAvatarPreview(updated.avatar || "");
        toast.success("Cập nhật hồ sơ thành công");
      } else {
        toast.error(response.data.message || "Cập nhật thất bại");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Cập nhật hồ sơ thất bại"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logoutSession(dispatch);
    toast.success("Đã đăng xuất thành công");
    navigate("/");
  };

  if (!userInfo && !loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Container>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="relative w-20 h-20 flex-shrink-0">
                  <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center overflow-hidden">
                    {avatarPreview || userInfo?.avatar ? (
                      <img
                        src={avatarPreview || userInfo.avatar}
                        alt={userInfo?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FaUserCircle className="text-4xl text-white" />
                    )}
                  </div>
                  <label
                    htmlFor="profile-avatar"
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-800 border-2 border-white"
                    title="Đổi ảnh đại diện"
                  >
                    {uploadingAvatar ? (
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FaCamera className="text-xs" />
                    )}
                  </label>
                  <input
                    id="profile-avatar"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={uploadingAvatar}
                  />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Chào mừng trở lại, {userInfo?.name || "bạn"}!
                  </h1>
                  <p className="text-gray-600">
                    Quản lý thông tin tài khoản của bạn
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <FaSignOutAlt />
                Đăng xuất
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form chỉnh sửa */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 md:p-8"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Chỉnh sửa thông tin
              </h2>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                        {avatarPreview || userInfo?.avatar ? (
                          <img
                            src={avatarPreview || userInfo?.avatar}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <FaUserCircle className="text-3xl" />
                          </div>
                        )}
                      </div>
                      <label
                        htmlFor="profile-avatar-form"
                        className="absolute -bottom-1 -right-1 w-7 h-7 bg-gray-900 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-800"
                      >
                        <FaCamera className="text-[10px]" />
                      </label>
                      <input
                        id="profile-avatar-form"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                        disabled={uploadingAvatar}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Ảnh đại diện
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG — tối đa 5MB
                        {uploadingAvatar && " • Đang tải..."}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Họ và tên
                    </label>
                    <div className="relative">
                      <FaUserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={form.name}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        placeholder="Nhập họ tên"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email
                    </label>
                    <div className="relative">
                      <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        readOnly
                        disabled
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        title="Email gắn với tài khoản, không thể đổi"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Email đăng nhập không thể thay đổi
                      </p>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Số điện thoại
                    </label>
                    <div className="relative">
                      <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={form.phone}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        placeholder="0901234567"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="address"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Địa chỉ
                    </label>
                    <div className="relative">
                      <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
                      <textarea
                        id="address"
                        name="address"
                        rows={3}
                        value={form.address}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                        placeholder="Số nhà, đường, quận, thành phố"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaSave />
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </form>
              )}
            </motion.div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Tài khoản
                </h3>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-500">Vai trò</dt>
                    <dd className="font-medium text-gray-900 capitalize">
                      {userInfo?.role === "admin"
                        ? "Quản trị viên"
                        : "Khách hàng"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Email đăng nhập</dt>
                    <dd className="font-medium text-gray-900 break-all">
                      {userInfo?.email}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Lối tắt
                </h3>
                <Link
                  to="/orders"
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FaShoppingBag className="text-gray-600" />
                    <span className="font-medium text-gray-900">
                      Đơn hàng của tôi
                    </span>
                  </div>
                  {orderCount > 0 && (
                    <span className="bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded-full">
                      {orderCount}
                    </span>
                  )}
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Profile;
