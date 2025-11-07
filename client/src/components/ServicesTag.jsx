import { useState } from "react";
import { Link } from "react-router-dom";
import Container from "./Container";
import { TbTruckDelivery } from "react-icons/tb";
import { HiOutlineCurrencyDollar } from "react-icons/hi2";
import { BiSupport } from "react-icons/bi";
import { MdOutlinePayment } from "react-icons/md";
import { MdClose } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";

const services = [
  {
    title: "Giao hàng miễn phí",
    subtitle: "Miễn phí vận chuyển cho đơn hàng từ 50$ trở lên",
    icon: <TbTruckDelivery />,
    details: {
      description:
        "Tận hưởng dịch vụ giao hàng tiêu chuẩn miễn phí cho mọi đơn hàng có giá trị từ 50$ trở lên. Chúng tôi hợp tác với các đơn vị vận chuyển uy tín để đảm bảo sản phẩm đến tay bạn an toàn và đúng hẹn.",
      features: [
        "Miễn phí vận chuyển cho đơn từ 50$",
        "Giao hàng tiêu chuẩn: 3-5 ngày làm việc",
        "Có tùy chọn giao nhanh",
        "Theo dõi đơn hàng theo thời gian thực",
        "Đóng gói an toàn",
      ],
    },
  },
  {
    title: "Đổi trả dễ dàng",
    subtitle: "Chính sách hoàn trả trong 30 ngày",
    icon: <HiOutlineCurrencyDollar />,
    details: {
      description:
        "Không hài lòng với sản phẩm? Đừng lo! Chính sách đổi trả linh hoạt của chúng tôi cho phép bạn hoàn trả bất kỳ sản phẩm nào trong vòng 30 ngày kể từ ngày mua.",
      features: [
        "Thời hạn hoàn trả 30 ngày",
        "Hoàn tiền 100%",
        "Miễn phí phí vận chuyển hoàn hàng",
        "Quy trình đổi trả trực tuyến dễ dàng",
        "Không tính phí xử lý",
      ],
    },
  },
  {
    title: "Hỗ trợ 24/7",
    subtitle: "Đội ngũ chuyên viên luôn sẵn sàng",
    icon: <BiSupport />,
    details: {
      description:
        "Đội ngũ hỗ trợ khách hàng tận tâm của chúng tôi luôn sẵn sàng phục vụ bạn 24/7 — bất kể thời gian nào — để giải đáp thắc mắc, hỗ trợ đơn hàng hoặc hướng dẫn sử dụng sản phẩm.",
      features: [
        "Hỗ trợ 24/7",
        "Trò chuyện trực tiếp",
        "Hỗ trợ qua email và điện thoại",
        "Tư vấn sản phẩm chuyên sâu",
        "Theo dõi đơn hàng nhanh chóng",
      ],
    },
  },
  {
    title: "Thanh toán an toàn",
    subtitle: "100% giao dịch bảo mật",
    icon: <MdOutlinePayment />,
    details: {
      description:
        "Mua sắm an tâm với hệ thống thanh toán bảo mật cao cấp — tất cả giao dịch đều được mã hóa và tuân thủ tiêu chuẩn bảo mật quốc tế.",
      features: [
        "Mã hóa SSL an toàn",
        "Nhiều hình thức thanh toán",
        "Bảo vệ chống gian lận",
        "Tuân thủ chuẩn PCI DSS",
        "Quy trình thanh toán bảo mật",
      ],
    },
  },
];

const ServicesTag = () => {
  const [selectedService, setSelectedService] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
  };

  return (
    <section className="bg-gradient-to-r from-gray-50 to-white border-t border-gray-100">
      <Container className="py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services?.map((item, index) => (
            <div
              key={index}
              onClick={() => handleServiceClick(item)}
              className="group flex flex-col items-center text-center p-6 rounded-2xl bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100 cursor-pointer"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-2xl text-white">{item?.icon}</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-700 transition-colors duration-200">
                  {item?.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed max-w-[200px]">
                  {item?.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Nút đóng */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <MdClose className="w-5 h-5 text-gray-500" />
              </button>

              {/* Tiêu đề Modal */}
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-xl text-white">
                    {selectedService.icon}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedService.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedService.subtitle}
                  </p>
                </div>
              </div>

              {/* Nội dung Modal */}
              <div className="mb-6">
                <p className="text-gray-700 leading-relaxed mb-4">
                  {selectedService.details.description}
                </p>

                <h4 className="font-semibold text-gray-900 mb-3">
                  Các tính năng chính:
                </h4>
                <ul className="space-y-2">
                  {selectedService.details.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-center text-sm text-gray-600"
                    >
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mr-3 flex-shrink-0"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Nút hành động */}
              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Đóng
                </button>
                <Link to="/shop" className="flex-1" onClick={closeModal}>
                  <button className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium">
                    Mua sắm ngay
                  </button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default ServicesTag;
