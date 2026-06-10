import mongoose from "mongoose";
import productModel from "./models/productModel.js";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://hoangtran253:hoangtran253@ac-nbxi66t-shard-00-00.nqi2xrd.mongodb.net/orebi?retryWrites=true&w=majority&appName=ac-nbxi66t";

const ALLOWED_COLORS = ["Đen", "Trắng", "Xanh", "Hồng"];

const fixColors = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Find all products with variants
    const productsWithVariants = await productModel.find({ hasVariants: true }).select("name category variants").lean();
    
    let totalRemoved = 0;
    
    for (const product of productsWithVariants) {
      if (!product.variants || product.variants.length === 0) continue;
      
      const originalVariants = product.variants;
      const filteredVariants = product.variants.filter(v => ALLOWED_COLORS.includes(v.color));
      
      const removedCount = originalVariants.length - filteredVariants.length;
      
      if (removedCount > 0) {
        console.log(`\n${product.name} (${product.category}):`);
        console.log(`  Original: ${originalVariants.length} variants`);
        console.log(`  Removed: ${removedCount} variants`);
        
        const removedColors = [...new Set(originalVariants.filter(v => !ALLOWED_COLORS.includes(v.color)).map(v => v.color))];
        console.log(`  Removed colors: ${removedColors.join(", ")}`);
        
        // Update product with filtered variants
        await productModel.updateOne(
          { _id: product._id },
          { 
            variants: filteredVariants,
            stock: filteredVariants.reduce((sum, v) => sum + (v.stock || 0), 0)
          }
        );
        
        totalRemoved += removedCount;
      }
    }
    
    console.log(`\nTotal variants removed: ${totalRemoved}`);
    console.log("Done!");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

fixColors();
