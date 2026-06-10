import axios from "axios";
import { serverUrl } from "../../config";
import { addUser, setOrderCount } from "../redux/orebiSlice";
import { loadUserCartFromServer } from "./userCart";

export const fetchUserOrderCount = async (dispatch, token) => {
  try {
    const response = await fetch(`${serverUrl}/api/order/my-orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (data.success) {
      dispatch(setOrderCount(data.orders.length));
    }
  } catch (error) {
    console.error("Error fetching order count:", error);
  }
};

export const completeLoginSession = async (dispatch, token, loginUser) => {
  localStorage.setItem("token", token);

  try {
    const profileRes = await axios.get(`${serverUrl}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (profileRes.data?.success) {
      const u = profileRes.data.user;
      dispatch(
        addUser({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          avatar: u.avatar || "",
        })
      );
    } else if (loginUser) {
      dispatch(
        addUser({
          id: loginUser.id,
          name: loginUser.name,
          email: loginUser.email,
          role: loginUser.role,
          avatar: loginUser.avatar || "",
        })
      );
    }
  } catch {
    if (loginUser) {
      dispatch(
        addUser({
          id: loginUser.id,
          name: loginUser.name,
          email: loginUser.email,
          role: loginUser.role,
          avatar: loginUser.avatar || "",
        })
      );
    }
  }

  await fetchUserOrderCount(dispatch, token);
  await loadUserCartFromServer(dispatch, token);
};
