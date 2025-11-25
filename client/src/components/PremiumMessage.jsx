import { motion } from "framer-motion";
import { FaPhone, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 text-white py-20">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Liên hệ với chúng tôi
            </h1>
            <p className="text-xl md:text-2xl text-blue-100">
              Chúng tôi luôn sẵn sàng hỗ trợ mọi thắc mắc của bạn!
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 px-4">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <h2 className="text-3xl font-bold mb-6 text-gray-800">
              Gửi tin nhắn cho chúng tôi
            </h2>

            <form className="space-y-5">
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập họ tên..."
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Email của bạn..."
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Tin nhắn
                </label>
                <textarea
                  rows="5"
                  className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Viết lời nhắn..."
                ></textarea>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-600 text-white w-full p-4 rounded-xl text-lg font-semibold shadow-md hover:bg-blue-700"
              >
                Gửi thông tin
              </motion.button>
            </form>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <h2 className="text-3xl font-bold mb-6 text-gray-800">
              Thông tin liên hệ
            </h2>

            <div className="space-y-6 text-gray-700">
              <div className="flex items-center gap-4">
                <FaPhone className="text-blue-600 text-3xl" />
                <div>
                  <p className="font-semibold text-gray-800">Điện thoại</p>
                  <p>0123 456 789</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <FaEnvelope className="text-blue-600 text-3xl" />
                <div>
                  <p className="font-semibold text-gray-800">Email</p>
                  <p>contact@example.com</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <FaMapMarkerAlt className="text-blue-600 text-3xl" />
                <div>
                  <p className="font-semibold text-gray-800">Địa chỉ</p>
                  <p>123 Nguyễn Văn Cừ, Quận 5, TP.HCM</p>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <iframe
                className="w-full h-64 rounded-2xl shadow-md"
                src="https://maps.google.com/maps?q=hcm&t=&z=13&ie=UTF8&iwloc=&output=embed"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
