import { useState } from "react";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import Container from "../components/Container";
import Breadcrumbs from "../components/Breadcrumbs";

const FAQ = () => {
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (index) => {
    setOpenItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const faqData = [
    {
      category: "Đơn hàng & Giao hàng",
      questions: [
        {
          question: "Thời gian giao hàng mất bao lâu?",
          answer:
            "Thời gian giao hàng tiêu chuẩn thường mất 3–5 ngày làm việc trong nội địa. Giao hàng nhanh (1–2 ngày) và giao hàng qua đêm có sẵn với phụ phí. Đối với quốc tế, thời gian thường từ 7–14 ngày làm việc tùy khu vực.",
        },
        {
          question: "Tôi có thể theo dõi đơn hàng của mình không?",
          answer:
            "Có! Sau khi đơn hàng được gửi đi, bạn sẽ nhận được email chứa mã theo dõi. Bạn cũng có thể theo dõi đơn hàng bằng cách đăng nhập vào tài khoản và truy cập mục 'Đơn hàng của tôi'.",
        },
        {
          question: "Chính sách đổi trả của cửa hàng là gì?",
          answer:
            "Chúng tôi chấp nhận đổi trả trong vòng 30 ngày đối với sản phẩm chưa sử dụng và còn nguyên bao bì. Hoàn tiền sẽ được xử lý trong 5–7 ngày làm việc sau khi nhận được hàng hoàn trả.",
        },
        {
          question: "Cửa hàng có giao hàng quốc tế không?",
          answer:
            "Có, chúng tôi giao hàng đến hầu hết các quốc gia trên thế giới. Phí và thời gian giao hàng quốc tế sẽ khác nhau tùy khu vực. Khách hàng chịu trách nhiệm cho mọi thuế và phí hải quan (nếu có).",
        },
      ],
    },
    {
      category: "Sản phẩm & Kích cỡ",
      questions: [
        {
          question: "Làm sao để biết nên chọn size nào?",
          answer:
            "Mỗi trang sản phẩm đều có bảng kích thước chi tiết. Bạn cũng có thể xem hướng dẫn chọn size chung ở cuối trang web. Nếu bạn đang ở giữa hai size, chúng tôi khuyên bạn nên chọn size lớn hơn. Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ nếu bạn cần tư vấn.",
        },
        {
          question: "Sản phẩm của cửa hàng có chính hãng không?",
          answer:
            "Chắc chắn rồi! Chúng tôi nhập hàng trực tiếp từ các nhà phân phối và thương hiệu chính hãng. Tất cả sản phẩm đều có cam kết chính hãng và bao bì gốc.",
        },
        {
          question: "Sản phẩm có được bảo hành không?",
          answer:
            "Có, tất cả sản phẩm đều có bảo hành của nhà sản xuất. Thời hạn bảo hành khác nhau tùy thương hiệu và loại sản phẩm. Một số mặt hàng có thể có tùy chọn gia hạn bảo hành khi thanh toán.",
        },
        {
          question: "Bao lâu thì sản phẩm được nhập lại?",
          answer:
            "Các sản phẩm phổ biến thường được nhập lại mỗi 2–4 tuần. Bạn có thể đăng ký nhận thông báo khi sản phẩm được nhập lại trên trang chi tiết sản phẩm. Theo dõi chúng tôi trên mạng xã hội để cập nhật hàng mới nhanh nhất!",
        },
      ],
    },
    {
      category: "Tài khoản & Thanh toán",
      questions: [
        {
          question: "Tôi có cần tạo tài khoản để mua hàng không?",
          answer:
            "Không bắt buộc, bạn có thể thanh toán với tư cách khách. Tuy nhiên, việc tạo tài khoản sẽ giúp bạn theo dõi đơn hàng, lưu danh sách yêu thích, địa chỉ giao hàng và nhận ưu đãi dành riêng cho thành viên.",
        },
        {
          question: "Cửa hàng chấp nhận hình thức thanh toán nào?",
          answer:
            "Chúng tôi chấp nhận thẻ tín dụng (Visa, Mastercard, American Express, Discover), PayPal, Apple Pay, Google Pay và Shop Pay. Mọi thanh toán đều được bảo mật với chuẩn mã hóa hiện đại.",
        },
        {
          question: "Thông tin thanh toán của tôi có an toàn không?",
          answer:
            "Có! Chúng tôi sử dụng mã hóa SSL và tuân thủ tiêu chuẩn bảo mật PCI DSS. Thông tin thẻ của bạn sẽ không bao giờ được lưu trữ trên máy chủ của chúng tôi.",
        },
        {
          question: "Tôi có thể lưu nhiều địa chỉ giao hàng không?",
          answer:
            "Có, người dùng có tài khoản có thể lưu nhiều địa chỉ khác nhau để thanh toán nhanh hơn. Bạn có thể thêm, chỉnh sửa hoặc xóa địa chỉ bất kỳ lúc nào trong phần cài đặt tài khoản.",
        },
      ],
    },
    {
      category: "Hỗ trợ khách hàng",
      questions: [
        {
          question: "Làm sao để liên hệ với bộ phận chăm sóc khách hàng?",
          answer:
            "Bạn có thể liên hệ với chúng tôi qua email support@orebi.com, số điện thoại 1-800-OREBI-SHOP, hoặc trò chuyện trực tuyến. Giờ làm việc: Thứ 2 – Thứ 6, từ 9:00 đến 18:00 (giờ EST).",
        },
        {
          question: "Nếu tôi nhận hàng bị hỏng thì sao?",
          answer:
            "Chúng tôi rất tiếc nếu bạn gặp phải tình huống này! Hãy liên hệ với chúng tôi trong vòng 48 giờ kể từ khi nhận hàng và gửi kèm ảnh sản phẩm bị lỗi. Chúng tôi sẽ nhanh chóng gửi sản phẩm thay thế hoặc hoàn tiền đầy đủ.",
        },
        {
          question: "Tôi có thể hủy hoặc sửa đơn hàng không?",
          answer:
            "Bạn có thể hủy hoặc sửa đơn hàng trong vòng 1 giờ sau khi đặt. Sau thời gian này, đơn hàng sẽ được xử lý và không thể thay đổi. Vui lòng liên hệ sớm với chúng tôi nếu cần chỉnh sửa đơn hàng.",
        },
        {
          question: "Cửa hàng có hỗ trợ so sánh giá không?",
          answer:
            "Có! Chúng tôi hỗ trợ so sánh giá cho các sản phẩm giống hệt từ các nhà bán lẻ được ủy quyền. Sản phẩm phải còn hàng và giá của đối thủ có thể được xác minh. Hãy gửi thông tin chi tiết để được hỗ trợ so sánh giá.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="py-8">
        <Breadcrumbs currentPage="Câu hỏi thường gặp" />

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Câu hỏi thường gặp
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Dưới đây là các câu hỏi phổ biến khi mua sắm tại Orebi. 
              Không tìm thấy câu trả lời bạn cần? Hãy liên hệ với đội ngũ hỗ trợ của chúng tôi.
            </p>
          </div>

          {/* FAQ Sections */}
          <div className="space-y-8">
            {faqData.map((category, categoryIndex) => (
              <div
                key={categoryIndex}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="bg-gray-900 text-white px-6 py-4">
                  <h2 className="text-xl font-semibold">{category.category}</h2>
                </div>

                <div className="divide-y divide-gray-200">
                  {category.questions.map((item, questionIndex) => {
                    const itemKey = `${categoryIndex}-${questionIndex}`;
                    const isOpen = openItems[itemKey];

                    return (
                      <div
                        key={questionIndex}
                        className="border-b border-gray-200 last:border-b-0"
                      >
                        <button
                          className="w-full px-6 py-4 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors duration-200"
                          onClick={() => toggleItem(itemKey)}
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900 pr-4">
                              {item.question}
                            </h3>
                            {isOpen ? (
                              <IoChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                            ) : (
                              <IoChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                            )}
                          </div>
                        </button>

                        {isOpen && (
                          <div className="px-6 pb-4">
                            <p className="text-gray-600 leading-relaxed">
                              {item.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="mt-12 bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Vẫn còn thắc mắc?
            </h2>
            <p className="text-gray-600 mb-6">
              Đội ngũ hỗ trợ khách hàng của chúng tôi luôn sẵn sàng giúp bạn giải đáp mọi câu hỏi hoặc vấn đề.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="/contact"
                className="bg-gray-900 text-white px-8 py-3 rounded-md hover:bg-gray-800 transition-colors duration-200"
              >
                Liên hệ với chúng tôi
              </a>
              <a
                href="mailto:support@orebi.com"
                className="border border-gray-300 text-gray-700 px-8 py-3 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                Gửi email hỗ trợ
              </a>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default FAQ;
