import mongoose from "mongoose";

const stockLogSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      required: true,
    },
    productName: { type: String, required: true },
    type: {
      type: String,
      enum: ["import", "export", "adjust", "audit"],
      required: true,
    },
    quantityChange: { type: Number, required: true },
    stockBefore: { type: Number, required: true },
    stockAfter: { type: Number, required: true },
    note: { type: String, default: "" },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "order",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    createdByName: { type: String, default: "" },
  },
  { timestamps: true }
);

const stockLogModel =
  mongoose.models.stockLog ||
  mongoose.model("stockLog", stockLogSchema);

export default stockLogModel;
