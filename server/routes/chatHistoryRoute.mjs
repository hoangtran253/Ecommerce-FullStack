import express from "express";
import {
  getChatHistories,
  getChatHistory,
  deleteChatHistory,
  clearUserChatHistory,
  getChatHistoryStats,
} from "../controllers/chatHistoryController.mjs";
import adminAuth from "../middleware/adminAuth.js";

const chatHistoryRouter = express.Router();

const routeValue = "/api/chat-history";

// Admin only routes
chatHistoryRouter.get(`${routeValue}`, adminAuth, getChatHistories);
chatHistoryRouter.get(`${routeValue}/stats`, adminAuth, getChatHistoryStats);
chatHistoryRouter.get(`${routeValue}/:id`, adminAuth, getChatHistory);
chatHistoryRouter.delete(`${routeValue}/:id`, adminAuth, deleteChatHistory);
chatHistoryRouter.delete(`${routeValue}/user/:userId`, adminAuth, clearUserChatHistory);

export default chatHistoryRouter;
