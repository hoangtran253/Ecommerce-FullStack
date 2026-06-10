import "react";
import { Button } from "./ui/button";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutSession } from "../utils/logoutSession";

const Logout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    await logoutSession(dispatch);
    toast.success("Đã đăng xuất thành công");
    navigate("/");
  };
  return (
    <Button onClick={handleLogout} className="px-8 py-2.5">
      Đăng xuất
    </Button>
  );
};

export default Logout;
