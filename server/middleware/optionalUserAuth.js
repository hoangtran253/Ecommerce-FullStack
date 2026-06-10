import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

/** Gắn req.user nếu có token hợp lệ; không chặn khách vãng lai */
const optionalUserAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : req.headers.token;

    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id);
    if (user?.isActive) req.user = user;
  } catch {
    /* bỏ qua token không hợp lệ */
  }
  next();
};

export default optionalUserAuth;
