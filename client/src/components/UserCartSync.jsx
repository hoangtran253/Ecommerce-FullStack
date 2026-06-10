import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { syncUserCartToServer } from "../utils/userCart";

/** Đồng bộ giỏ Redux ↔ server khi user đã đăng nhập */
const UserCartSync = () => {
  const { products, userInfo } = useSelector((state) => state.orebiReducer);
  const skipSyncRef = useRef(true);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!userInfo) {
      skipSyncRef.current = true;
      return;
    }
    const t = setTimeout(() => {
      skipSyncRef.current = false;
    }, 600);
    return () => clearTimeout(t);
  }, [userInfo?.id]);

  useEffect(() => {
    if (!userInfo) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    if (skipSyncRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      syncUserCartToServer(products, token);
    }, 700);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [products, userInfo]);

  return null;
};

export default UserCartSync;
