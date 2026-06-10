import { STORE_CONTACT_INFO } from "../utils/contactInfo.mjs";

export const CHAT_SUGGESTIONS = [
  "Chào shop",
  "Bạn là ai?",
  "Nên mua gì?",
  "Sản phẩm bán chạy",
  "Sản phẩm mới nhất",
  "Thông tin cửa hàng",
  "Chính sách đổi trả",
  "Cách thanh toán",
];

export const GREETING_REPLY =
  "Xin chào! Mình là **trợ lý tư vấn OREBI**.\n\nMình có thể giúp bạn:\n• Tìm sản phẩm theo **thể loại**\n• Tìm theo **giá tiền**\n• Tìm theo **đánh giá** (sao)\n• Xem **thông tin cửa hàng** & **liên hệ**\n• Hướng dẫn **quên mật khẩu**\n• Xem **giỏ hàng** của bạn\n\nBạn cần gì nhé?";

export const CONTACT_REPLY = `**Liên hệ OREBI** (cố định trên hệ thống):\n• **Hotline:** ${STORE_CONTACT_INFO.displayPhone}\n• **Email:** ${STORE_CONTACT_INFO.email}\n• **Địa chỉ:** ${STORE_CONTACT_INFO.address}, ${STORE_CONTACT_INFO.city}\n• **Form liên hệ:** /contact`;

export const FORGOT_PASSWORD_REPLY = `**Cách lấy lại mật khẩu:**\n\n1. Vào **/signin** (Đăng nhập)\n2. Bấm **"Quên mật khẩu?"**\n3. Liên hệ **admin shop** qua:\n   • Email: **${STORE_CONTACT_INFO.email}**\n   • Hotline: **${STORE_CONTACT_INFO.displayPhone}**\n   • Hoặc gửi tin tại **/contact**\n\nAdmin xác minh tài khoản và hỗ trợ đặt lại mật khẩu cho bạn.`;

export const ORDER_TRACK_REPLY =
  "Để xem đơn hàng: đăng nhập → **Đơn hàng**. Nếu chưa có tài khoản, đăng ký bằng email đã dùng khi đặt hàng.";

export const FAQ_ENTRIES = [
  {
    keys: ["giao hàng", "giao hang", "ship", "bao lâu", "bao lau", "nhận hàng", "nhan hang", "vận chuyển", "van chuyen", "delivery"],
    answer:
      "Thời gian giao hàng tiêu chuẩn: **3–5 ngày làm việc** (nội địa). Bạn theo dõi đơn tại mục **Đơn hàng** sau khi đăng nhập.",
  },
  {
    keys: ["đổi trả", "doi tra", "hoàn", "hoan", "trả hàng", "tra hang", "refund", "doi hang", "đổi hàng", "doi hang"],
    answer:
      "Chính sách đổi trả trong **30 ngày** với sản phẩm chưa dùng, còn nguyên tem/mác. Hoàn tiền xử lý trong **5–7 ngày làm việc** sau khi nhận hàng trả.",
  },
  {
    keys: ["thanh toán", "thanh toan", "cod", "stripe", "trả tiền", "tra tien", "cach thanh toan", "cách thanh toán"],
    answer:
      "Hỗ trợ **COD** (thanh toán khi nhận) và **thẻ qua Stripe**. Thanh toán được mã hóa, an toàn.",
  },
  {
    keys: ["size", "kích cổ", "kich co", "chọn size", "chon size", "cỡ", "co size", "bang size"],
    answer:
      "Mỗi trang sản phẩm có **bảng size**. Nếu đang phân vân giữa hai size, nên chọn **size lớn hơn**.",
  },
  {
    keys: ["bảo hành", "bao hanh", "warranty", "hư hỏng", "hu hong", "lỗi", "loi"],
    answer:
      "Sản phẩm được bảo hành theo quy định của nhà sản xuất. Nếu có lỗi từ nhà sản xuất, liên hệ shop trong **7 ngày** để đổi mới.",
  },
  {
    keys: ["khuyến mãi", "khuyen mai", "sale", "giảm giá", "giam gia", "voucher", "uu dai", "ưu đãi"],
    answer:
      "Shop thường xuyên có chương trình khuyến mãi. Theo dõi trang chủ và fanpage để không bỏ lỡ deal hot! Sản phẩm đang giảm giá có tag 🏷️.",
  },
  {
    keys: ["hàng chính hãng", "hang chinh hang", "authentic", "thật", "that", "hàng giả", "hang gia", "hang fake"],
    answer:
      "OREBI cam kết **100% sản phẩm chính hãng**. Có đầy đủ tem mác, hóa đơn. Phát hiện hàng giả, hoàn tiền **200%**.",
  },
  {
    keys: ["freeship", "free ship", "miễn phí vận chuyển", "mien phi van chuyen", "phi ship"],
    answer:
      "Miễn phí vận chuyển cho đơn hàng **từ 500k** trở lên. Đơn dưới 500k phí ship **30k**.",
  },
  {
    keys: ["tư vấn", "tu van", "gợi ý", "goi y", "nên mua", "nen mua", "huong dan tu van"],
    answer:
      "Bạn có thể hỏi theo **thể loại** (Áo, Giày, Quần...), theo **giá** (dưới 500k, từ 1 triệu...), hoặc xem **sản phẩm bán chạy/mới nhất**.",
  },
  {
    keys: ["đặt hàng", "dat hang", "mua hàng", "mua hang", "cách mua", "cach mua", "quy trinh dat hang"],
    answer:
      "Chọn sản phẩm → **Thêm vào giỏ** → Điền thông tin → Chọn thanh toán (COD/Stripe) → Xác nhận. Nhận hàng trong **3-5 ngày**.",
  },
  {
    keys: ["hủy đơn", "huy don", "cancel", "thay đổi", "thay doi", "huy don hang"],
    answer:
      "Hủy đơn trong vòng **1 giờ** sau khi đặt. Sau đó, liên hệ shop qua **hotline** hoặc form **/contact** để xử lý.",
  },
  {
    keys: ["kho", "tồn kho", "ton kho", "còn hàng", "con hang", "het hang", "hết hàng", "kiem tra ton kho"],
    answer:
      "Số lượng tồn kho hiển thị trên **mỗi trang sản phẩm**. Nếu hết hàng, bạn có thể đặt trước để shop thông báo khi có hàng.",
  },
];
