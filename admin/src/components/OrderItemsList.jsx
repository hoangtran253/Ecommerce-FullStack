import { getOrderItemLines } from "../utils/dashboard";

/** Danh sách SP trong đơn — mỗi SP một dòng, tên đầy đủ */
const OrderItemsList = ({ items, compact = false }) => {
  const lines = getOrderItemLines(items);

  if (!lines.length) {
    return <span className="text-sm text-gray-400">—</span>;
  }

  return (
    <ul className={`${compact ? "space-y-1" : "space-y-1.5"} min-w-[140px]`}>
      {lines.map((line) => (
        <li
          key={line.key}
          className="text-sm text-gray-900 leading-snug border-b border-gray-100 last:border-0 pb-1.5 last:pb-0"
        >
          <span className="block break-words font-medium">{line.name}</span>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {line.selectedSize && (
              <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                Size: {line.selectedSize}
              </span>
            )}
            {line.selectedColor && (
              <span className="text-xs bg-pink-100 text-pink-800 px-1.5 py-0.5 rounded">
                {line.selectedColor}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500">
            SL: {line.quantity}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default OrderItemsList;
