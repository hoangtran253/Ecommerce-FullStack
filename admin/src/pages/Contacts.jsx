import PremiumMessage from "../components/PremiumMessage";

const Contacts = () => {
  const contactFeatures = [
    "Hệ thống quản lý liên hệ nâng cao",
    "Mẫu email trả lời tự động",
    "Phân tích và báo cáo liên hệ",
    "Thao tác liên hệ hàng loạt",
    "Phân khúc và lọc liên hệ",
    "Hệ thống phiếu hỗ trợ ưu tiên",
  ];

  return (
    <PremiumMessage
      title="Quản lý liên hệ nâng cao"
      description="Quản lý các yêu cầu của khách hàng, phiếu hỗ trợ và thông tin liên lạc với hệ thống quản lý liên hệ toàn diện của chúng tôi."
      features={contactFeatures}
    />
  );
};

export default Contacts;
