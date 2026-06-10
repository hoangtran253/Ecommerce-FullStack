import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      trim: true,
      default: "Liên hệ từ website",
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    status: {
      type: String,
      enum: ["unread", "read", "replied"],
      default: "unread",
    },
    adminNotes: {
      type: String,
      trim: true,
      default: "",
    },
    images: {
      type: [String],
      default: [],
    },
    /** Nội dung shop trả lời — hiển thị cho khách */
    adminReply: {
      type: String,
      trim: true,
      default: "",
    },
    repliedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
contactSchema.index({ userId: 1 });
contactSchema.index({ status: 1 });
contactSchema.index({ createdAt: -1 });

export default mongoose.model("Contact", contactSchema);
