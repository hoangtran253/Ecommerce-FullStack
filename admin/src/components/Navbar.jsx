import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { logo } from "../assets/images";
import { serverUrl } from "../../config";
import {
  FaUser,
  FaCog,
  FaChevronDown,
  FaUserShield,
  FaSignOutAlt,
} from "react-icons/fa";
import { MdNotifications, MdDashboard } from "react-icons/md";
import { logout } from "../redux/authSlice";
import toast from "react-hot-toast";
import NotificationPanel from "./NotificationPanel";
import {
  getNotifSeenAt,
  markNotifSeen,
  formatRelativeTime,
} from "../utils/notifications";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Đăng xuất thành công!");
    navigate("/login");
  };

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingNotif(true);
      const seen = getNotifSeenAt();
      const params = seen ? `?since=${encodeURIComponent(seen)}` : "";
      const res = await axios.get(
        `${serverUrl}/api/notifications/admin${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        const seenAt = getNotifSeenAt();
        if (seenAt) {
          setUnreadCount(res.data.unreadCount ?? 0);
        } else {
          setUnreadCount(res.data.notifications?.length ?? 0);
        }
      }
    } catch {
      /* giữ badge cũ */
    } finally {
      setLoadingNotif(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleNotifications = () => {
    const opening = !isNotificationOpen;
    setIsNotificationOpen(opening);
    if (opening) {
      markNotifSeen();
      setUnreadCount(0);
      fetchNotifications();
    }
  };

  const getUserInitials = (name) => {
    if (!name) return "A";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const previewList = notifications.slice(0, 8);

  const userMenuItems = [
    { icon: FaUser, label: "Hồ sơ", path: "/profile" },
    { icon: MdDashboard, label: "Dashboard", path: "/" },
    { icon: FaCog, label: "Cài đặt", path: "/settings" },
  ];

  const logoutMenuItem = {
    icon: FaSignOutAlt,
    label: "Đăng xuất",
    onClick: handleLogout,
  };

  const goToNotifLink = (link) => {
    setIsNotificationOpen(false);
    if (link) navigate(link);
  };

  return (
    <>
      <header className="border-b border-gray-200 w-full sticky top-0 left-0 z-40 bg-white shadow-sm">
        <div className="py-2.5 flex items-center justify-between px-4">
          <Link to={"/"} className="flex items-center gap-3 group">
            <img
              src={logo}
              alt="logo"
              className="w-20 sm:w-24 transition-transform duration-200 group-hover:scale-105"
            />
            <div className="hidden sm:block">
              <p className="text-xs uppercase font-bold tracking-wide text-blue-600">
                Admin Panel
              </p>
              <p className="text-xs text-gray-500">Dashboard v1.0</p>
            </div>
          </Link>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden md:flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full">
              <FaUserShield className="text-blue-600 text-sm" />
              <span className="text-sm font-medium text-blue-700">Admin</span>
            </div>

            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={toggleNotifications}
                className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
                aria-label="Thông báo"
              >
                <MdNotifications className="text-xl" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Thông báo</h3>
                    <p className="text-sm text-gray-500">
                      {loadingNotif
                        ? "Đang tải..."
                        : `${notifications.length} hoạt động gần đây`}
                    </p>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {previewList.length === 0 ? (
                      <p className="px-4 py-8 text-sm text-gray-500 text-center">
                        Không có thông báo mới
                      </p>
                    ) : (
                      previewList.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => goToNotifLink(notification.link)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                            notification.highlight ? "bg-purple-50/40" : ""
                          }`}
                        >
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsNotificationOpen(false);
                        markNotifSeen();
                        setUnreadCount(0);
                        setShowAllNotifications(true);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium w-full text-center"
                    >
                      Xem tất cả thông báo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {user && (
              <div className="relative" ref={userMenuRef}>
                <div className="flex items-center gap-2">
                  <div className="hidden lg:flex items-center gap-3 text-sm text-gray-600 mr-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {user.name || user.email}
                      </p>
                      <p className="text-xs text-gray-500">Quản trị viên</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-50 transition-colors duration-200"
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center font-semibold text-sm">
                        {getUserInitials(user?.name || user?.email)}
                      </div>
                    )}
                    <FaChevronDown
                      className={`text-gray-600 text-sm transition-transform duration-200 ${
                        isUserMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-900 truncate">
                        {user.name || user.email}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="py-1">
                      {userMenuItems.map((item, index) => (
                        <Link
                          key={index}
                          to={item.path}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <item.icon className="text-gray-400" />
                          {item.label}
                        </Link>
                      ))}
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logoutMenuItem.onClick();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <logoutMenuItem.icon className="text-red-400" />
                        {logoutMenuItem.label}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {showAllNotifications && (
        <NotificationPanel
          notifications={notifications}
          onClose={() => {
            setShowAllNotifications(false);
            fetchNotifications();
          }}
        />
      )}
    </>
  );
};

export default Navbar;
