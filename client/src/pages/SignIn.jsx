import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import axios from "axios";
import { serverUrl } from "../../config";
import { useDispatch } from "react-redux";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUserCircle,
  FaArrowRight,
  FaTimes,
  FaPhone,
} from "react-icons/fa";
import Container from "../components/Container";
import { completeLoginSession } from "../utils/completeLogin";

const SHOP_CONTACT = {
  email: "phamkhanam01@gmail.com",
  phone: "0358 939 667",
};

const SignIn = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errEmail, setErrEmail] = useState("");
  const [errPassword, setErrPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/");
    }
  }, [navigate]);

  const handleEmail = (e) => {
    setEmail(e.target.value);
    setErrEmail("");
  };

  const handlePassword = (e) => {
    setPassword(e.target.value);
    setErrPassword("");
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrEmail("");
    setErrPassword("");

    if (!email) {
      setErrEmail("Vui lòng nhập email");
      setIsLoading(false);
      return;
    }
    if (!password) {
      setErrPassword("Vui lòng nhập mật khẩu");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(serverUrl + "/api/user/login", {
        email: email.trim().toLowerCase(),
        password,
      });
      const data = response?.data;
      if (data?.success) {
        await completeLoginSession(dispatch, data.token, data.user);
        toast.success(data.message);
        navigate(location.state?.from || "/");
      } else {
        toast.error(data?.message);
      }
    } catch (error) {
      console.log("User login error", error);
      toast.error(error?.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Container>
        <div className="sm:w-[450px] w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <FaUserCircle className="text-2xl text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Chào mừng trở lại
              </h1>
              <p className="text-gray-600">
                Đăng nhập để tiếp tục mua sắm
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Địa chỉ email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={handleEmail}
                    className={`block w-full pl-10 pr-3 py-3 border ${
                      errEmail ? "border-red-300" : "border-gray-300"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors`}
                    placeholder="Nhập địa chỉ email của bạn"
                  />
                </div>
                {errEmail && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-600 flex items-center gap-1"
                  >
                    <span className="font-bold">!</span>
                    {errEmail}
                  </motion.p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePassword}
                    className={`block w-full pl-10 pr-12 py-3 border ${
                      errPassword ? "border-red-300" : "border-gray-300"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors`}
                    placeholder="Nhập mật khẩu của bạn"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errPassword && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-600 flex items-center gap-1"
                  >
                    <span className="font-bold">!</span>
                    {errPassword}
                  </motion.p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Quên mật khẩu?
                </button>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang đăng nhập...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Đăng nhập
                    <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </motion.button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Chưa có tài khoản?
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Tạo tài khoản mới
                <FaArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </Container>

      <AnimatePresence>
        {forgotOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative"
            >
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
                aria-label="Đóng"
              >
                <FaTimes />
              </button>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Quên mật khẩu
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Vui lòng liên hệ admin shop để được hỗ trợ đặt lại mật khẩu.
              </p>
              <ul className="space-y-3 text-sm text-gray-700 mb-6">
                <li className="flex items-center gap-2">
                  <FaEnvelope className="text-gray-400 shrink-0" />
                  <a
                    href={`mailto:${SHOP_CONTACT.email}`}
                    className="text-gray-900 hover:underline"
                  >
                    {SHOP_CONTACT.email}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <FaPhone className="text-gray-400 shrink-0" />
                  <a
                    href={`tel:${SHOP_CONTACT.phone.replace(/\s/g, "")}`}
                    className="text-gray-900 hover:underline"
                  >
                    {SHOP_CONTACT.phone}
                  </a>
                </li>
              </ul>
              <Link
                to="/contact"
                onClick={() => setForgotOpen(false)}
                className="block w-full text-center py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800"
              >
                Trang liên hệ
              </Link>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SignIn;
