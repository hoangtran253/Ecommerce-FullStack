/** Thông tin liên hệ cửa hàng OREBI (Đà Nẵng) */
export const STORE_CONTACT_INFO = {
  phone: "03589396667",
  displayPhone: "0358 939 667667",
  email: "phamkhanam01@gmail.com",
  address: "33 Xô Viết Nghệ Tĩnh, P. Hòa Cường, Tp Đà Nẵng",
  city: "Đà Nẵng",
  lat: 16.045,
  lng: 108.2226,
};

export const getMapEmbedUrl = (info = STORE_CONTACT_INFO) => {
  const q = encodeURIComponent(info.address);
  return `https://www.google.com/maps?q=${q}&hl=vi&z=16&output=embed`;
};
