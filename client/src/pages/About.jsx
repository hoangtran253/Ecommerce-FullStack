import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Container from "../components/Container";
import { FaUsers, FaGlobe, FaAward, FaHeart } from "react-icons/fa";
import { MdSecurity, MdLocalShipping, MdSupport } from "react-icons/md";

const stats = [
  { number: "50K+", label: "Khách hàng hài lòng", icon: <FaUsers /> },
  { number: "100+", label: "Quốc gia phục vụ", icon: <FaGlobe /> },
  { number: "5 năm", label: "Kinh nghiệm ngành", icon: <FaAward /> },
  { number: "99%", label: "Hài lòng khách hàng", icon: <FaHeart /> },
];

const values = [
  {
    icon: <MdSecurity />,
    title: "Tin cậy & Bảo mật",
    description:
      "Bảo mật của bạn là ưu tiên hàng đầu. Chúng tôi sử dụng mã hóa và các biện pháp bảo mật hàng đầu để bảo vệ dữ liệu và giao dịch của bạn.",
  },
  {
    icon: <MdLocalShipping />,
    title: "Giao hàng nhanh & uy tín",
    description:
      "Giao hàng nhanh chóng, dịch vụ uy tín. Chúng tôi hợp tác với các đơn vị vận chuyển đáng tin cậy để đảm bảo đơn hàng đến tay bạn đúng hẹn.",
  },
  {
    icon: <MdSupport />,
    title: "Khách hàng là trung tâm",
    description:
      "Hỗ trợ 24/7, đổi trả dễ dàng. Đội ngũ tận tâm luôn sẵn sàng hỗ trợ mọi thắc mắc của bạn.",
  },
];

const About = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-700 text-white py-20">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Về Orebi Shopping
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              Chúng tôi đam mê mang đến cho bạn trải nghiệm mua sắm tốt nhất với sản phẩm chất lượng, dịch vụ tận tâm và giá cả cạnh tranh. Khám phá lý do hàng triệu khách hàng tin tưởng lựa chọn chúng tôi.
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white">{stat.icon}</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Our Story Section */}
      <section className="py-20">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Câu chuyện của chúng tôi
              </h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Thành lập vào năm 2019, Orebi Shopping bắt đầu với sứ mệnh đơn giản:
                  mang sản phẩm chất lượng đến với mọi người, mọi nơi.
                  Từ một cửa hàng trực tuyến nhỏ, chúng tôi đã phát triển thành một
                  sàn thương mại điện tử uy tín phục vụ khách hàng trên toàn thế giới.
                </p>
                <p>
                  Chúng tôi tin rằng mua sắm không chỉ đơn thuần là một
                  giao dịch – mà còn phải là một trải nghiệm thú vị và truyền cảm hứng.
                  Đó là lý do chúng tôi cẩn thận lựa chọn sản phẩm,
                  hợp tác với các nhà cung cấp uy tín, và đầu tư vào
                  công nghệ tiên tiến để đảm bảo mọi tương tác với nền tảng của chúng tôi đều suôn sẻ.
                </p>
                <p>
                  Hiện nay, chúng tôi tự hào phục vụ hơn 50.000 khách hàng
                  trên toàn thế giới, cung cấp mọi thứ từ xu hướng thời trang mới nhất
                  đến các thiết bị công nghệ hiện đại, tất cả đều được đảm bảo về
                  chất lượng, giá cả hợp lý và dịch vụ khách hàng xuất sắc.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-8 h-96 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl text-white">🛍️</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Chất lượng là số 1
                    </h3>
                    <p className="text-gray-600 mt-2">
                      Mọi sản phẩm đều được lựa chọn cẩn thận
                    </p>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Our Values Section */}
      <section className="py-20 bg-gray-50">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Giá trị cốt lõi
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Những nguyên tắc cốt lõi này hướng dẫn mọi việc chúng tôi làm và
              định hình trải nghiệm chúng tôi tạo ra cho khách hàng.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-300"
              >
                <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-6">
                  <span className="text-2xl text-white">{value.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-6">
              Sẵn sàng mua sắm?
            </h2>
            <p className="text-gray-300 text-lg mb-8">
              Tham gia cùng hàng nghìn khách hàng hài lòng và khám phá lý do tại sao
              Orebi Shopping là lựa chọn hàng đầu cho mua sắm trực tuyến.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/shop">
                <button className="px-8 py-4 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-semibold">
                  Mua sắm ngay
                </button>
              </Link>
              <Link to="/contact">
                <button className="px-8 py-4 border border-white text-white rounded-lg hover:bg-white hover:text-gray-900 transition-colors font-semibold">
                  Liên hệ với chúng tôi
                </button>
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>
    </div>
  );
};

export default About;
