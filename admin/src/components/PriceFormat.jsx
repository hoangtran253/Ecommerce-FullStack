import { cn } from "./ui/cn";

export const formatCurrency = (amount) => {
  const numericAmount =
    typeof amount === "number" && !isNaN(amount) ? amount : Number(amount) || 0;

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(numericAmount);
};

const PriceFormat = ({ amount, className }) => {
  return <span className={cn(className)}>{formatCurrency(amount)}</span>;
};

export default PriceFormat;
