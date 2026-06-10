import chatHistoryModel from "../models/chatHistoryModel.js";
import userModel from "../models/userModel.js";

export const getChatHistories = async (req, res) => {
  try {
    const { userId, limit = 50 } = req.query;
    const filter = {};
    
    if (userId) filter.userId = userId;
    
    const histories = await chatHistoryModel
      .find(filter)
      .populate("userId", "name email")
      .sort({ lastUpdated: -1 })
      .limit(parseInt(limit));
    
    res.status(200).json({ success: true, data: histories });
  } catch (error) {
    console.error("Error fetching chat histories:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch chat histories" });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await chatHistoryModel.findById(id).populate("userId", "name email");
    
    if (!history) {
      return res.status(404).json({ success: false, message: "Chat history not found" });
    }
    
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch chat history" });
  }
};

export const deleteChatHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await chatHistoryModel.findById(id);
    
    if (!history) {
      return res.status(404).json({ success: false, message: "Chat history not found" });
    }
    
    await chatHistoryModel.findByIdAndDelete(id);
    
    res.status(200).json({ success: true, message: "Chat history deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat history:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to delete chat history" });
  }
};

export const clearUserChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const result = await chatHistoryModel.deleteMany({ userId });
    
    res.status(200).json({ 
      success: true, 
      message: `Deleted ${result.deletedCount} chat history records`,
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error("Error clearing user chat history:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to clear chat history" });
  }
};

export const getChatHistoryStats = async (req, res) => {
  try {
    const totalHistories = await chatHistoryModel.countDocuments();
    const totalMessages = await chatHistoryModel.aggregate([
      { $unwind: "$messages" },
      { $count: "total" }
    ]);
    
    const userStats = await chatHistoryModel.aggregate([
      {
        $group: {
          _id: "$userId",
          messageCount: { $sum: { $size: "$messages" } },
          lastActive: { $max: "$lastUpdated" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $sort: { messageCount: -1 }
      },
      { $limit: 10 }
    ]);
    
    res.status(200).json({ 
      success: true, 
      data: {
        totalHistories,
        totalMessages: totalMessages[0]?.total || 0,
        topUsers: userStats
      }
    });
  } catch (error) {
    console.error("Error fetching chat history stats:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch stats" });
  }
};
