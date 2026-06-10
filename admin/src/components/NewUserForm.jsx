import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import toast from "react-hot-toast";
import Input, { Label } from "./ui/input";
import axios from "axios";
import { serverUrl } from "../../config";
import { MdClose, MdLocationOn, MdPerson, MdEmail, MdLock, MdAdminPanelSettings } from "react-icons/md";
import { FaUserShield, FaCamera } from "react-icons/fa";
import PropTypes from "prop-types";
import AddressModal from "./AddressModal";
import { formatAddressLine } from "../utils/addressFormat";

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

const NewUserForm = ({
  isOpen,
  setIsOpen,
  close,
  selectedUser,
  getUsersList,
  token,
  isReadOnly = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    isActive: true,
    avatar: "",
  });

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const fetchUserAddresses = useCallback(
    async (userId) => {
      try {
        const response = await axios.get(
          `${serverUrl}/api/user/${userId}/addresses`,
          { headers: authHeaders(token) }
        );

        if (response.data.success) {
          setUserAddresses(response.data.addresses || []);
        } else if (selectedUser?.addresses?.length) {
          setUserAddresses(selectedUser.addresses);
        }
      } catch (error) {
        console.log("Fetch addresses error", error);
      }
    },
    [token]
  );

  useEffect(() => {
    if (!isOpen) return;

    if (selectedUser) {
      setFormData({
        _id: selectedUser?._id || null,
        name: selectedUser.name || "",
        email: selectedUser.email || "",
        password: "",
        role: selectedUser.role || "user",
        isActive:
          selectedUser.isActive !== undefined ? selectedUser.isActive : true,
        avatar: selectedUser.avatar || "",
      });

      setAvatarPreview(selectedUser.avatar || "");

      setUserAddresses(selectedUser.addresses || []);
      if (selectedUser._id) {
        fetchUserAddresses(selectedUser._id);
      }
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "user",
        isActive: true,
        avatar: "",
      });
      setUserAddresses([]);
      setAvatarPreview("");
      setAvatarFile(null);
    }
  }, [isOpen, selectedUser, fetchUserAddresses]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Kích thước ảnh phải nhỏ hơn 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn tệp hình ảnh");
        return;
      }

      setAvatarFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return null;

    const formData = new FormData();
    formData.append("avatar", avatarFile);

    try {
      const response = await axios.post(
        `${serverUrl}/api/user/upload-avatar`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        return response.data.avatarUrl;
      } else {
        toast.error(response.data.message);
        return null;
      }
    } catch (error) {
      console.log("Avatar upload error", error);
      toast.error("Tải ảnh đại diện thất bại");
      return null;
    }
  };

  const handleAddOrUpdateUser = async (e) => {
    e.preventDefault();

    if (isReadOnly) {
      toast.error("Không thể chỉnh sửa - Chế độ chỉ đọc");
      return;
    }

    try {
      let avatarUrl = formData.avatar;

      if (avatarFile) {
        const uploadedUrl = await uploadAvatar();
        if (!uploadedUrl) {
          return;
        }
        avatarUrl = uploadedUrl;
      }

      let response;

      // Tránh gửi avatar rỗng khiến backend ghi đè thành ""
      const userData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
      };

      if (avatarUrl) {
        userData.avatar = avatarUrl;
      }


      // Important: server cập nhật mật khẩu dựa vào `req.body.password`
      // (không phải field rỗng). Chỉ gửi password khi người dùng đã nhập.
      if (formData.password && formData.password.trim().length > 0) {
        userData.password = formData.password;
      }

      if (selectedUser) {
        // Tránh gửi password rỗng để backend không bị lỗi/không cập nhật
        response = await axios.put(
          `${serverUrl}/api/user/update/${selectedUser._id}`,
          { ...userData, _id: selectedUser._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Tạo user mới: password bắt buộc theo backend
        response = await axios.post(
          `${serverUrl}/api/user/register`,
          userData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }


      const data = await response?.data;

      if (data?.success) {
        toast.success(data?.message);
        setAvatarFile(null);
        if (data.user?.avatar) {
          setAvatarPreview(data.user.avatar);
        }
        setIsOpen(false);
        getUsersList();
      } else {
        toast.error(data?.message);
      }
    } catch (error) {
      console.log("User save error", error);
      toast.error(error?.response?.data?.message || "Đã xảy ra lỗi");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <Dialog
      open={isOpen}
      as="div"
      className="relative z-[9999] focus:outline-none"
      onClose={close}
    >
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-[10000] w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-2 sm:p-4 lg:p-6">
          <DialogPanel
            transition
            className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl 
                     rounded-2xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-6 
                     bg-gradient-to-br from-white to-gray-50 shadow-2xl border border-gray-200 text-black 
                     max-h-[95vh] sm:max-h-[90vh] overflow-y-auto
                     transform transition-all duration-300 ease-out
                     data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2 pb-4 border-b border-gray-200">
              <DialogTitle
                as="h3"
                className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent pr-2"
              >
                {isReadOnly
                  ? "👤 Thông tin người dùng"
                  : selectedUser
                  ? "✏️ Chỉnh sửa người dùng"
                  : "➕ Thêm người dùng mới"}
              </DialogTitle>
              <button
                onClick={() => setIsOpen(false)}
                className="self-end sm:self-auto text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                         transition-colors p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Đóng modal"
              >
                <MdClose size={24} />
              </button>
            </div>

            {isReadOnly && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ℹ️ Đây là chế độ chỉ đọc. Chỉ quản trị viên mới có thể chỉnh
                  sửa thông tin người dùng.
                </p>
              </div>
            )}

            <form
              onSubmit={handleAddOrUpdateUser}
              className="space-y-4 sm:space-y-6"
            >
              {/* Thông tin cơ bản */}
              <div className="space-y-3 sm:space-y-4 bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></span>
                  Thông tin cơ bản
                </h4>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  <div className="relative">
                    <Label htmlFor="name">Họ và tên *</Label>
                    <div className="relative">
                      <MdPerson className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="name"
                        type="text"
                        name="name"
                        placeholder="Nhập họ và tên"
                        onChange={handleChange}
                        value={formData.name}
                        required
                        disabled={isReadOnly}
                        className={`pl-10 ${isReadOnly ? "bg-gray-50" : ""}`}
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <Label htmlFor="email">Địa chỉ Email *</Label>
                    <div className="relative">
                      <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        name="email"
                        placeholder="Nhập email"
                        onChange={handleChange}
                        value={formData.email}
                        required
                        disabled={isReadOnly}
                        className={`pl-10 ${isReadOnly ? "bg-gray-50" : ""}`}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <Label htmlFor="role">Vai trò</Label>
                    <div className="relative">
                      <MdAdminPanelSettings className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        disabled={isReadOnly}
                        className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent ${
                          isReadOnly ? "bg-gray-50" : ""
                        }`}
                      >
                        <option value="user">Người dùng</option>
                        <option value="admin">Quản trị viên</option>
                      </select>
                    </div>
                  </div>
                  <div className="relative">
                    <Label htmlFor="isActive">Trạng thái tài khoản</Label>
                    <div className="relative">
                      <FaUserShield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <select
                        id="isActive"
                        name="isActive"
                        value={formData.isActive}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            isActive: e.target.value === "true",
                          }));
                        }}
                        disabled={isReadOnly}
                        className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent ${
                          isReadOnly ? "bg-gray-50" : ""
                        }`}
                      >
                        <option value="true">Hoạt động</option>
                        <option value="false">Ngưng hoạt động</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <Label htmlFor="password">
                    {selectedUser
                      ? "Mật khẩu mới (tuỳ chọn)"
                      : "Mật khẩu *"}
                  </Label>
                  <div className="relative">
                    <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      name="password"
                      placeholder="Nhập mật khẩu"
                      onChange={handleChange}
                      value={formData.password}
                      required={!selectedUser}
                      disabled={isReadOnly}
                      className={`pl-10 ${isReadOnly ? "bg-gray-50" : ""}`}
                    />
                  </div>
                </div>

                {/* Ảnh đại diện */}
                <div className="space-y-3">
                  <Label className="font-semibold text-gray-700">Ảnh đại diện</Label>
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                    <div className="relative group">
                      {avatarPreview || formData.avatar ? (
                        <img
                          src={avatarPreview || formData.avatar}
                          alt="Avatar preview"
                          className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-xl">
                          {formData.name
                            ? formData.name.charAt(0).toUpperCase()
                            : "?"}
                        </div>
                      )}
                      <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <FaCamera className="text-white text-2xl" />
                      </div>
                    </div>

                    {!isReadOnly && (
                      <div className="flex-1">
                        <input
                          type="file"
                          id="avatar"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="avatar"
                          className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl 
                                   hover:from-blue-700 hover:to-purple-700 cursor-pointer transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02] text-sm font-medium"
                        >
                          <FaCamera />
                          {avatarFile ? "Thay ảnh" : "Tải ảnh lên"}
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                          PNG, JPG tối đa 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Địa chỉ — đồng bộ với hồ sơ khách trên web */}
              {selectedUser && (
                <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-4 bg-white border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center shadow-md">
                        <MdLocationOn className="text-xl" />
                      </span>
                      <div>
                        <h4 className="text-base font-semibold text-gray-900">
                          Địa chỉ giao hàng
                        </h4>
                        <p className="text-xs text-gray-500">
                          Cập nhật từ trang Hồ sơ khách cũng hiển thị tại đây
                        </p>
                      </div>
                    </div>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => setIsAddressModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg"
                      >
                        <MdLocationOn />
                        Sửa địa chỉ ({userAddresses.length})
                      </button>
                    )}
                  </div>

                  <div className="p-4">
                    {userAddresses.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-6">
                        Chưa có địa chỉ. Khách có thể thêm ở trang Hồ sơ hoặc
                        bạn bấm &quot;Sửa địa chỉ&quot;.
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {userAddresses.map((addr, index) => (
                          <li
                            key={addr._id || index}
                            className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
                          >
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="text-sm font-semibold text-gray-900">
                                {addr.label || `Địa chỉ ${index + 1}`}
                              </span>
                              {addr.isDefault && (
                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                  Mặc định
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {formatAddressLine(addr)}
                            </p>
                            {addr.phone && (
                              <p className="text-sm text-gray-600 mt-2">
                                <span className="text-gray-400">SĐT:</span>{" "}
                                {addr.phone}
                              </p>
                            )}
                            {addr.zipCode && (
                              <p className="text-xs text-gray-500 mt-1">
                                Mã bưu điện: {addr.zipCode}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {/* Hành động */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 
                         rounded-xl hover:bg-gray-50 focus:ring-2 focus:ring-gray-300 
                         transition-all duration-300 font-medium text-sm sm:text-base"
                >
                  {isReadOnly ? "Đóng" : "Huỷ"}
                </button>
                {!isReadOnly && (
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 
                           focus:ring-2 focus:ring-gray-300 transition-all duration-300 
                           font-medium text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    {selectedUser ? "💾 Cập nhật" : "➕ Tạo mới"}
                  </button>
                )}
              </div>
            </form>
          </DialogPanel>
        </div>
      </div>

      <AddressModal
        isOpen={isAddressModalOpen}
        close={() => setIsAddressModalOpen(false)}
        userId={selectedUser?._id}
        token={token}
        onAddressesChange={() => {
          if (selectedUser?._id) {
            fetchUserAddresses(selectedUser._id);
          }
          getUsersList();
        }}
      />
    </Dialog>
  );
};

NewUserForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
  close: PropTypes.func.isRequired,
  selectedUser: PropTypes.object,
  getUsersList: PropTypes.func.isRequired,
  token: PropTypes.string.isRequired,
  isReadOnly: PropTypes.bool,
};

export default NewUserForm;
