import { useEffect } from "react";
import { useDispatch } from "react-redux";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { addUser, removeUser, setOrderCount, resetOrderCount } from "../redux/orebiSlice";
import { serverUrl } from "../../config";
import { persistor } from "../redux/store";
import { loadUserCartFromServer } from "../utils/userCart";

/** Tải profile (gồm avatar) vào Redux khi có token */
const AuthBootstrap = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      dispatch(removeUser());
      dispatch(resetOrderCount());
      persistor.flush();
      return;
    }

    const loadSession = async () => {
      try {
        const [profileRes, ordersRes] = await Promise.all([
          axios.get(`${serverUrl}/api/user/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${serverUrl}/api/order/my-orders`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (profileRes.data?.success) {
          const u = profileRes.data.user;
          dispatch(
            addUser({
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
              avatar: u.avatar || "",
              phone: u.phone,
              address: u.address,
            })
          );
        } else {
          dispatch(addUser(jwtDecode(token)));
        }

        if (ordersRes.data?.success) {
          dispatch(setOrderCount(ordersRes.data.orders?.length || 0));
        }

        await loadUserCartFromServer(dispatch, token);
      } catch {
        try {
          dispatch(addUser(jwtDecode(token)));
        } catch {
          localStorage.removeItem("token");
          dispatch(removeUser());
          dispatch(resetOrderCount());
          persistor.flush();
        }
      }
    };

    loadSession();
  }, [dispatch]);

  return null;
};

export default AuthBootstrap;
