/** Một dòng địa chỉ đầy đủ */
export const formatAddressLine = (addr) => {
  if (!addr) return "—";
  const parts = [addr.street, addr.city, addr.state, addr.country].filter(
    Boolean
  );
  return parts.length ? parts.join(", ") : "—";
};
