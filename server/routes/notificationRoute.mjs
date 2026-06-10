import { Router } from "express";
import { getAdminNotifications } from "../controllers/notificationController.mjs";
import adminAuth from "../middleware/adminAuth.js";

const router = Router();

router.get("/api/notifications/admin", adminAuth, getAdminNotifications);

export default router;
