import express from "express";
import {
  createFaq,
  getFaqs,
  getFaq,
  updateFaq,
  deleteFaq,
  getActiveFaqsForChatbot,
} from "../controllers/faqController.mjs";
import adminAuth from "../middleware/adminAuth.js";

const faqRouter = express.Router();

const routeValue = "/api/faq";

// Public routes (for chatbot)
faqRouter.get(`${routeValue}/chatbot`, getActiveFaqsForChatbot);

// Admin only routes
faqRouter.get(`${routeValue}`, adminAuth, getFaqs);
faqRouter.get(`${routeValue}/:id`, adminAuth, getFaq);
faqRouter.post(`${routeValue}`, adminAuth, createFaq);
faqRouter.put(`${routeValue}/:id`, adminAuth, updateFaq);
faqRouter.delete(`${routeValue}/:id`, adminAuth, deleteFaq);

export default faqRouter;
