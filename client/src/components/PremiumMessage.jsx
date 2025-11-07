import { motion } from "framer-motion";
import { FaStar, FaGift, FaCode, FaRocket, FaLock } from "react-icons/fa";
import { MdSecurity, MdSupportAgent } from "react-icons/md";

const PremiumMessage = ({
  title = "Tính năng Premium",
  description = "Chức năng này chỉ khả dụng trong phiên bản Premium.",
  showFeatures = true,
}) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Phần giới thiệu chính - Premium Focus */}
      <section className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl mb-8">
              <FaLock className="text-4xl text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-yellow-100 bg-clip-text text-transparent">
              🔒 {title}
            </h1>
            <p className="text-2xl md:text-3xl text-yellow-100 leading-relaxed mb-8 font-medium">
              {description}
            </p>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-4">
                💎 Cần quyền truy cập Premium
              </h3>
              <p className="text-xl text-white/90 mb-6">
                Tính năng này chỉ khả dụng trong phiên bản Premium.  
                Nhận quyền truy cập ngay để mở khóa toàn bộ mã nguồn và tất cả chức năng.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <a
                  href="https://buymeacoffee.com/reactbd/e/442025"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-4 bg-white text-gray-900 px-10 py-5 rounded-2xl hover:bg-yellow-50 transition-all duration-300 font-bold text-xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 hover:scale-105"
                >
                  <FaGift className="text-2xl text-amber-500" />
                  Nhận quyền Premium ngay
                </a>
                <div className="text-lg text-yellow-100 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/20">
                  ⚡ Truy cập ngay • Thanh toán một lần
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {showFeatures && (
        <>
          {/* Lợi ích khi nâng cấp Premium */}
          <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-6xl mx-auto text-center"
              >
                <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  💎 Những gì bạn nhận được khi nâng cấp Premium
                </h2>
                <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                  Toàn bộ mã nguồn, bảng quản trị Admin, và các tính năng chuyên nghiệp hoàn chỉnh.
                </p>

                <div className="grid md:grid-cols-3 gap-8 mb-16">
                  <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-8 border border-amber-500/30">
                    <FaCode className="text-4xl text-amber-400 mb-6 mx-auto" />
                    <h3 className="text-2xl font-bold text-white mb-4">
                      Mã nguồn hoàn chỉnh
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      Bao gồm toàn bộ Frontend React, Backend Node.js, mô hình cơ sở dữ liệu và hệ thống xác thực.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/30">
                    <MdSecurity className="text-4xl text-blue-400 mb-6 mx-auto" />
                    <h3 className="text-2xl font-bold text-white mb-4">
                      Bảng điều khiển quản trị
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      Quản lý tất cả tính năng, người dùng và cài đặt hệ thống với giao diện admin chuyên nghiệp.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-green-500/20 to-teal-500/20 backdrop-blur-sm rounded-2xl p-8 border border-green-500/30">
                    <FaRocket className="text-4xl text-green-400 mb-6 mx-auto" />
                    <h3 className="text-2xl font-bold text-white mb-4">
                      Tính năng nâng cao
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      Hỗ trợ thời gian thực, thông báo, tải tệp, và tích hợp email tự động.
                    </p>
                  </div>
                </div>

                {/* Nút kêu gọi nâng cấp */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-8 md:p-12 text-center">
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                    🎯 Sẵn sàng mở khóa toàn bộ tính năng?
                  </h3>
                  <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
                    Truy cập toàn bộ hệ thống, tiết kiệm hàng tuần phát triển, và triển khai nhanh chóng!
                  </p>
                  <a
                    href="https://buymeacoffee.com/reactbd/e/442025"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-4 bg-white text-gray-900 px-12 py-6 rounded-2xl hover:bg-gray-100 transition-all duration-300 font-bold text-2xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-2"
                  >
                    <FaGift className="text-3xl text-amber-500" />
                    Mở khóa Premium ngay
                  </a>
                  <p className="text-white/80 mt-6 text-lg">
                    💰 Thanh toán một lần • 🔄 Cập nhật trọn đời • 📞 Hỗ trợ Premium
                  </p>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Danh sách tính năng Premium */}
          <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-6xl mx-auto"
              >
                <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                    🚀 Các tính năng hệ thống chuyên nghiệp
                  </h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                    Tiết kiệm hàng tháng phát triển với các tính năng sẵn sàng sản xuất — đủ mọi chức năng doanh nghiệp cần.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border-2 border-amber-200 hover:border-amber-300 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1">
                    <FaRocket className="text-3xl text-amber-600 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      Tính năng thời gian thực
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Cập nhật trực tiếp, thông báo tức thì và đồng bộ trên mọi thiết bị.
                    </p>
                    <div className="text-sm text-amber-700 bg-amber-100 px-3 py-1 rounded-full inline-block">
                      ⚡ Nhanh & Mượt
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1">
                    <MdSecurity className="text-3xl text-blue-600 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      Bảo mật & Mã hóa
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Mã hóa đầu-cuối, xác thực người dùng và phân quyền quản trị.
                    </p>
                    <div className="text-sm text-blue-700 bg-blue-100 px-3 py-1 rounded-full inline-block">
                      🔒 Cấp độ doanh nghiệp
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200 hover:border-green-300 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1">
                    <FaCode className="text-3xl text-green-600 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      Mã nguồn đầy đủ
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Gồm React frontend, Node.js backend, và cơ sở dữ liệu MongoDB.
                    </p>
                    <div className="text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full inline-block">
                      📦 Sẵn sàng triển khai
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-200 hover:border-purple-300 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1">
                    <MdSupportAgent className="text-3xl text-purple-600 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      Bảng điều khiển quản trị
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Giao diện admin đẹp mắt với thống kê và báo cáo chi tiết.
                    </p>
                    <div className="text-sm text-purple-700 bg-purple-100 px-3 py-1 rounded-full inline-block">
                      📊 Có sẵn Analytics
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-8 border-2 border-teal-200 hover:border-teal-300 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1">
                    <FaGift className="text-3xl text-teal-600 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      Tính năng bổ sung
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Thông báo email, upload tệp, mẫu sẵn có, và giao diện responsive.
                    </p>
                    <div className="text-sm text-teal-700 bg-teal-100 px-3 py-1 rounded-full inline-block">
                      🎁 Giá trị cộng thêm
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8 border-2 border-red-200 hover:border-red-300 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1">
                    <FaStar className="text-3xl text-red-600 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      Hỗ trợ Premium
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Tài liệu chi tiết, hướng dẫn cài đặt và cộng đồng hỗ trợ tận tâm.
                    </p>
                    <div className="text-sm text-red-700 bg-red-100 px-3 py-1 rounded-full inline-block">
                      🤝 Luôn đồng hành
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default PremiumMessage;
