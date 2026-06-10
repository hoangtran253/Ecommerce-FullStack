import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "bot"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  products: [{
    id: String,
    name: String,
    price: Number,
    image: String,
    category: String,
    avgRating: Number,
    reviewCount: Number,
  }],
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
    index: true,
  },
  messages: [chatMessageSchema],
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index để tìm nhanh theo userId và thời gian
chatHistorySchema.index({ userId: 1, lastUpdated: -1 });

const chatHistoryModel = mongoose.models.chatHistory || mongoose.model("chatHistory", chatHistorySchema);

export default chatHistoryModel;
