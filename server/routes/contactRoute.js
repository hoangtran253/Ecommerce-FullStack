import express from "express";
import {
  getContactInfo,
  createContact,
  getAllContacts,
  getContactById,
  updateContactStatus,
  replyToContact,
  deleteContact,
  getUserContacts,
} from "../controllers/contactController.js";
import userAuth from "../middleware/userAuth.js";
import optionalUserAuth from "../middleware/optionalUserAuth.js";
import adminAuth from "../middleware/adminAuth.js";
import upload from "../middleware/multer.mjs";

const router = express.Router();

const routeValue = "/api/contact";

router.get(`${routeValue}/info`, getContactInfo);
router.post(
  `${routeValue}`,
  optionalUserAuth,
  upload.array("images", 5),
  createContact
);
router.get(`${routeValue}/my-contacts`, userAuth, getUserContacts);

// Admin routes (require admin authentication)
router.get(`${routeValue}/admin/all`, adminAuth, getAllContacts);
router.get(`${routeValue}/admin/:id`, adminAuth, getContactById);
router.put(`${routeValue}/admin/:id/status`, adminAuth, updateContactStatus);
router.put(`${routeValue}/admin/:id/reply`, adminAuth, replyToContact);
router.delete(`${routeValue}/admin/:id`, adminAuth, deleteContact);

export default router;
