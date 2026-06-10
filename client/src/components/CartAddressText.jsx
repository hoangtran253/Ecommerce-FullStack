/* eslint-disable react/prop-types */
/** Hiển thị địa chỉ giao hàng — xuống dòng khi chữ dài */
// eslint-disable-next-line react/prop-types
const CartAddressText = ({ address, phoneLabel = "SĐT" }) => {
  if (!address) return null;

  const line2 = [address.city, address.state, address.zipCode, address.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-w-0 text-sm text-gray-600 leading-relaxed space-y-0.5">
      {address.street && (
        <p className="break-words [overflow-wrap:anywhere]">{address.street}</p>
      )}
      {line2 && (
        <p className="break-words [overflow-wrap:anywhere] text-gray-500">
          {line2}
        </p>
      )}
      {address.phone && (
        <p className="break-words text-gray-500 pt-0.5">
          {phoneLabel}: {address.phone}
        </p>
      )}
    </div>
  );
};

export default CartAddressText;
