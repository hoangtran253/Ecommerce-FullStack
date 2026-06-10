import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { loginSuccess } from "../redux/authSlice";
import { serverUrl } from "../../config";

/** Tải profile (gồm avatar) khi admin đã có token */
const AuthBootstrap = () => {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!token) return;
    if (user?.avatar) return;

    const loadProfile = async () => {
      try {
        const res = await axios.get(`${serverUrl}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success && res.data.user) {
          const u = res.data.user;
          dispatch(
            loginSuccess({
              token,
              user: {
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                avatar: u.avatar || "",
              },
            })
          );
        }
      } catch {
        /* giữ session hiện tại */
      }
    };

    loadProfile();
  }, [token, user?.avatar, dispatch]);

  return null;
};

export default AuthBootstrap;
