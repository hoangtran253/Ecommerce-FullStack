import PremiumMessage from "../components/PremiumMessage";

const ApiDocumentation = () => {
  const apiFeatures = [
    "Tài liệu đầy đủ về REST API",
"Giao diện kiểm tra API tương tác",
"Giám sát API theo thời gian thực",
"Điểm cuối xác thực",
"Tích hợp Webhook",
"Hỗ trợ và tài nguyên cho nhà phát triển",
  ];

  return (
    <PremiumMessage
      title="Tài liệu và tích hợp API"
      description="Truy cập tài liệu API toàn diện, công cụ thử nghiệm và tài nguyên tích hợp dành cho nhà phát triển."
      features={apiFeatures}
    />
  );
};

export default ApiDocumentation;
