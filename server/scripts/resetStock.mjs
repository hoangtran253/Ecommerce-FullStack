import mongoose from "mongoose";
import productModel from "../models/productModel.js";

const MONGO_URI = "mongodb+srv://hoangtran253:hoangtran253@cluster0.ihl6.mongodb.net/ecommerce?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");

    const result = await productModel.updateMany(
      {},
      {
        stock: 0,
        variants: [],
        hasVariants: false
      }
    );

    console.log(`Reset stock for ${result.modifiedCount} products`);
    console.log("All products now have stock: 0, variants: [], hasVariants: false");

    mongoose.connection.close();
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
