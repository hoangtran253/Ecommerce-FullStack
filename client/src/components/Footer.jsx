import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Container from "./Container";
import { Button } from "./ui/button";
import { paymentCard } from "../assets/images";
import SocialLinks from "./SocialLinks";
import { config } from "../../config";
import {
  fetchShopFilterOptions,
  shopCategoryLink,
  shopBrandLink,
} from "../utils/shopFilters";

const Footer = () => {
  const [emailInfo, setEmailInfo] = useState("");
  const [subscription, setSubscription] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    fetchShopFilterOptions(config?.baseUrl)
      .then(({ categories: cats, brands: brs }) => {
        setCategories(cats);
        setBrands(brs);
      })
      .catch(() => {
        setCategories([]);
        setBrands([]);
      });
  }, []);

  const emailValidation = () => {
    return String(emailInfo)
      .toLocaleLowerCase()
      .match(/^\w+([-]?\w+)*@\w+([-]?\w+)*(\.\w{2,3})+$/);
  };

  const handleSubscription = () => {
    if (emailInfo === "") {
      setErrMsg("Vui lòng nhập email!");
    } else if (!emailValidation(emailInfo)) {
      setErrMsg("Email không hợp lệ!");
    } else {
      setSubscription(true);
      setErrMsg("");
      setEmailInfo("");
    }
  };

  const quickLinks = [
    { label: "Giới thiệu", to: "/about" },
    { label: "Cửa hàng", to: "/shop" },
    { label: "Đơn hàng", to: "/orders" },
    { label: "Liên hệ", to: "/contact" },
    { label: "Câu hỏi thường gặp", to: "/faq" },
  ];

  return (
    <footer className="bg-white border-t border-gray-100">
      <Container className="py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">OREBI</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Thời trang & phụ kiện: áo, quần, giày, đồ thể thao và đồ mùa đông
              từ các thương hiệu Nike, Adidas, Uniqlo, Zara, H&M.
            </p>
            <SocialLinks
              className="text-gray-400 hover:text-gray-900"
              iconStyle="w-5 h-5 transition-colors duration-200"
            />
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-6">
              Liên kết nhanh
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-gray-600 hover:text-gray-900 transition-colors duration-200 text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Danh mục
            </h4>
            <ul className="space-y-3 mb-6">
              {categories.length === 0 ? (
                <li className="text-sm text-gray-500">Đang tải...</li>
              ) : (
                categories.map((cat) => (
                  <li key={cat}>
                    <Link
                      to={shopCategoryLink(cat)}
                      className="text-gray-600 hover:text-gray-900 transition-colors duration-200 text-sm"
                    >
                      {cat}
                    </Link>
                  </li>
                ))
              )}
            </ul>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Thương hiệu
            </h4>
            <ul className="space-y-3">
              {brands.length === 0 ? (
                <li className="text-sm text-gray-500">—</li>
              ) : (
                brands.map((brand) => (
                  <li key={brand}>
                    <Link
                      to={shopBrandLink(brand)}
                      className="text-gray-600 hover:text-gray-900 transition-colors duration-200 text-sm"
                    >
                      {brand}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-6">
              Cập nhật thông tin
            </h4>
            <p className="text-gray-600 mb-4 text-sm leading-relaxed">
              Đăng ký để nhận tin sản phẩm mới và ưu đãi độc quyền.
            </p>

            {subscription ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <p className="text-green-700 text-sm font-medium">
                  ✓ Đăng ký thành công! Cảm ơn bạn đã tham gia.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <div>
                  <input
                    onChange={(e) => setEmailInfo(e.target.value)}
                    value={emailInfo}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 text-sm"
                    type="email"
                    placeholder="Nhập email của bạn"
                  />
                  {errMsg && (
                    <p className="text-red-500 text-xs mt-2">{errMsg}</p>
                  )}
                </div>
                <Button
                  onClick={handleSubscription}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg transition-colors duration-200"
                >
                  Đăng ký
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} OREBI. Bảo lưu mọi quyền.
            </p>

            <div className="flex items-center gap-4">
              <span className="text-gray-500 text-sm">Chúng tôi chấp nhận:</span>
              <img
                src={paymentCard}
                alt="Phương thức thanh toán"
                className="h-8 object-contain opacity-60"
              />
            </div>

            <div className="flex gap-6">
              <Link
                to="/faq"
                className="text-gray-500 hover:text-gray-900 text-sm transition-colors duration-200"
              >
                Chính sách bảo mật
              </Link>
              <Link
                to="/faq"
                className="text-gray-500 hover:text-gray-900 text-sm transition-colors duration-200"
              >
                Điều khoản dịch vụ
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
