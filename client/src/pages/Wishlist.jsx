import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Container from "../components/Container";
import { FaHeart, FaShoppingBag, FaArrowLeft } from "react-icons/fa";

const Wishlist = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Container>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm p-8 mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                  <FaHeart className="text-2xl text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Danh sách yêu thích
                  </h1>
                  <p className="text-gray-600">
                    Lưu lại những sản phẩm bạn thích
                  </p>
                </div>
              </div>
              <Link
                to="/profile"
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <FaArrowLeft />
                Quay lại hồ sơ
              </Link>
            </div>
          </motion.div>

          {/* Empty State */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm p-12 text-center"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaHeart className="text-4xl text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Danh sách yêu thích của bạn đang trống
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Hãy bắt đầu xây dựng danh sách yêu thích bằng cách thêm những sản phẩm bạn thích. 
              Bạn có thể lưu sản phẩm trong lúc duyệt và quay lại xem sau.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              <FaShoppingBag />
              Bắt đầu mua sắm
            </Link>
          </motion.div>

          {/* Feature Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FaHeart className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Lưu yêu thích
              </h3>
              <p className="text-sm text-gray-600">
                Theo dõi những sản phẩm bạn yêu thích và muốn mua sau
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FaShoppingBag className="text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Mua nhanh chóng
              </h3>
              <p className="text-sm text-gray-600">
                Dễ dàng chuyển sản phẩm từ danh sách yêu thích vào giỏ hàng khi muốn mua
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FaHeart className="text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Không bao giờ quên</h3>
              <p className="text-sm text-gray-600">
                Danh sách yêu thích của bạn được đồng bộ trên tất cả thiết bị để không bao giờ mất
              </p>
            </div>
          </motion.div>
        </div>
      </Container>
    </div>
  );
};

export default Wishlist;
