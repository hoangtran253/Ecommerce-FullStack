import mongoose from "mongoose";

const faqSchema = new mongoose.Schema({
  keys: {
    type: [String],
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: "general",
    enum: ["general", "shipping", "payment", "product", "account", "return", "other"],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  priority: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Index để tìm kiếm nhanh
faqSchema.index({ keys: 1 });
faqSchema.index({ category: 1 });
faqSchema.index({ isActive: 1 });

const faqModel = mongoose.models.faq || mongoose.model("faq", faqSchema);

export default faqModel;
