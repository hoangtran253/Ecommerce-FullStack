import axios from "axios";
import { serverUrl } from "../../config";
import { setCart } from "../redux/orebiSlice";

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

/** Tải giỏ hàng đã lưu trên server vào Redux (sau đăng nhập) */
export const loadUserCartFromServer = async (dispatch, token) => {
  if (!token) return;
  try {
    const { data } = await axios.get(`${serverUrl}/api/user/cart`, {
      headers: authHeaders(token),
    });
    if (data?.success) {
      dispatch(setCart(data.items || []));
    }
  } catch (error) {
    console.error("Load user cart:", error);
  }
};

/** Lưu giỏ hiện tại lên server (khi đã đăng nhập) */
export const syncUserCartToServer = async (items, token) => {
  if (!token) return;
  try {
    await axios.put(
      `${serverUrl}/api/user/cart/sync`,
      { items },
      { headers: authHeaders(token) }
    );
  } catch (error) {
    console.error("Sync user cart:", error);
  }
};

/** Xóa giỏ hàng trên server */
export const clearUserCartOnServer = async (token) => {
  if (!token) return;
  try {
    await axios.put(
      `${serverUrl}/api/user/cart/sync`,
      { items: [] },
      { headers: authHeaders(token) }
    );
  } catch (error) {
    console.error("Clear user cart:", error);
  }
};
