import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
  size: { type: String },
  color: { type: String },
  stock: { type: Number, default: 0 },
});

const productSchema = new mongoose.Schema(
  {
    _type: { type: String },
    name: { type: String, required: true },
    images: { type: Array, required: true },
    price: { type: Number, required: true },
    discountedPercentage: { type: Number, required: true, default: 10 },
    stock: { type: Number, required: true, default: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    soldQuantity: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    category: { type: String, required: true },
    brand: { type: String },
    badge: { type: Boolean },
    isAvailable: { type: Boolean },
    offer: { type: Boolean },
    description: { type: String, required: true },
    tags: { type: Array },
    variants: { type: [variantSchema], default: [] },
    hasVariants: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const productModel =
  mongoose.models.product || mongoose.model("product", productSchema);

export default productModel;
