import { persistor } from "../redux/store";
import { removeUser, resetOrderCount } from "../redux/orebiSlice";

/** Đăng xuất: xóa token + giỏ local (giỏ trên server vẫn giữ để đăng nhập lại) */
export const logoutSession = async (dispatch) => {
  localStorage.removeItem("token");
  dispatch(removeUser());
  dispatch(resetOrderCount());
  await persistor.flush();
};
