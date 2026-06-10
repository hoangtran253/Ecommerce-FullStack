import { StatusCodes } from "http-status-codes";
import { CHAT_SUGGESTIONS } from "../data/chatKnowledge.mjs";
import { processChatMessage } from "../utils/chatbotEngine.mjs";
import chatHistoryModel from "../models/chatHistoryModel.js";

export const getChatSuggestions = (req, res) => {
  res.status(StatusCodes.OK).json({ suggestions: CHAT_SUGGESTIONS });
};

export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Vui lòng đăng nhập để xem lịch sử chat",
      });
    }

    const history = await chatHistoryModel.findOne({ userId }).sort({ lastUpdated: -1 });
    
    if (!history) {
      return res.status(StatusCodes.OK).json({ messages: [] });
    }

    res.status(StatusCodes.OK).json({ messages: history.messages });
  } catch (err) {
    console.error("getChatHistory:", err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Không thể tải lịch sử chat. Vui lòng thử lại.",
    });
  }
};

export const postChatMessage = async (req, res) => {
  try {
    console.log("postChatMessage called");
    const userId = req.user?._id;
    console.log("userId:", userId);
    if (!userId) {
      console.log("No userId, returning unauthorized");
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Vui lòng đăng nhập để sử dụng chatbot",
      });
    }

    const { message } = req.body || {};
    console.log("message:", message);
    const result = await processChatMessage(message, userId);

    // Lưu tin nhắn vào MongoDB
    const userMessage = {
      role: "user",
      content: message,
      products: [],
      timestamp: new Date(),
    };

    const botMessage = {
      role: "bot",
      content: result.reply,
      products: result.products || [],
      timestamp: new Date(),
    };

    // Cập nhật hoặc tạo mới lịch sử chat
    await chatHistoryModel.findOneAndUpdate(
      { userId },
      {
        $push: {
          messages: { $each: [userMessage, botMessage] },
        },
        $set: { lastUpdated: new Date() },
      },
      { upsert: true, new: true }
    );

    res.status(StatusCodes.OK).json({
      reply: result.reply,
      products: result.products || [],
    });
  } catch (err) {
    console.error("postChatMessage:", err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Không thể xử lý tin nhắn. Vui lòng thử lại.",
    });
  }
};
