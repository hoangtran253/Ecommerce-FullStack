import express from "express";
import userAuth from "../middleware/userAuth.js";
import {
  getChatSuggestions,
  postChatMessage,
  getChatHistory,
} from "../controllers/chatController.mjs";

const router = express.Router();
const routeValue = "/api/chat";

router.get(`${routeValue}/suggestions`, getChatSuggestions);
router.get(`${routeValue}/history`, userAuth, getChatHistory);
router.post(`${routeValue}/message`, userAuth, postChatMessage);

export default router;
