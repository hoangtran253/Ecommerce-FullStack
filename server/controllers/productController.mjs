import { v2 as cloudinary } from "cloudinary";
import { deleteCloudinaryImage } from "../config/cloudinary.js";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";
import fs from "fs";

// Helper function to clean up temporary files
const cleanupTempFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("Temporary file cleaned up:", filePath);
    }
  } catch (error) {
    console.error("Error cleaning up temporary file:", error);
  }
};

// Add product
const addProduct = async (req, res) => {
  try {
    const {
      _type,
      name,
      price,
      discountedPercentage,
      stock,
      category,
      brand,
      badge,
      isAvailable,
      offer,
      description,
      tags,
      hasVariants,
      variants,
    } = req.body;
    const image1 = req.files.image1 && req.files.image1[0];
    const image2 = req.files.image2 && req.files.image2[0];
    const image3 = req.files.image3 && req.files.image3[0];
    const image4 = req.files.image4 && req.files.image4[0];

    // Check for required fields
    if (!name || !price || !category || !description) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: name, price, category, and description are mandatory.",
      });
    }

    // Collect only the images that exist
    const images = [image1, image2, image3, image4].filter(
      (item) => item !== undefined
    );

    let imagesUrl = await Promise.all(
      images.map(async (item) => {
        try {
          let result = await cloudinary.uploader.upload(item.path, {
            folder: "orebi/products",
            resource_type: "image",
            transformation: [
              { width: 800, height: 800, crop: "fill" },
              { quality: "auto", fetch_format: "auto" },
            ],
          });

          // Clean up temporary file after successful upload
          cleanupTempFile(item.path);

          return result.secure_url;
        } catch (error) {
          // Clean up temporary file even on error
          cleanupTempFile(item.path);
          throw error;
        }
      })
    );

    // Parse tags or split if necessary
    let parsedTags;
    try {
      parsedTags = JSON.parse(tags);
    } catch (err) {
      parsedTags = tags ? tags.split(",").map((tag) => tag.trim()) : [];
    }

    // Parse variants if provided
    let parsedVariants = [];
    if (variants) {
      try {
        parsedVariants = JSON.parse(variants);
      } catch (err) {
        console.error("Error parsing variants:", err);
      }
    }

    // Calculate total stock from variants if hasVariants is true
    let totalStock = stock ? Number(stock) : 0;
    if (hasVariants === "true" && parsedVariants.length > 0) {
      totalStock = parsedVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    }

    const productData = {
      _type: _type ? _type : "",
      name,
      price: Number(price),
      discountedPercentage: discountedPercentage
        ? Number(discountedPercentage)
        : 10,
      stock: totalStock,
      soldQuantity: 0,
      category,
      brand: brand ? brand : "",
      badge: badge === "true" ? true : false,
      // Default to available unless explicitly set to "false"
      isAvailable: typeof isAvailable === "undefined" ? true : isAvailable === "true",
      offer: offer === "true" ? true : false,
      description,
      tags: tags ? parsedTags : [],
      images: imagesUrl,
      hasVariants: hasVariants === "true",
      variants: parsedVariants,
    };

    const product = new productModel(productData);
    // Ensure we wait for the DB write to complete before responding
    await product.save();

    res.json({
      success: true,
      message: `${name} added and saved to DB successfully`,
      product,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// List products with filtering
const listProducts = async (req, res) => {
  try {
    const {
      _type,
      _id,
      _search,
      brand,
      category,
      offer,
      onSale,
      isAvailable,
      _page = 1,
      _perPage = 25,
    } = req.query;

    // Filter by specific ID
    if (_id) {
      const dbProduct = await productModel.findById(_id);
      if (dbProduct) {
        // Format product for frontend compatibility
        const formattedProduct = {
          ...dbProduct.toObject(),
          image:
            dbProduct.images && dbProduct.images.length > 0
              ? dbProduct.images[0]
              : "",
        };
        return res.json({ success: true, product: formattedProduct });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }
    }

    // Build filter object for database query
    let filter = {};

    // Filter by availability only if frontend explicitly provided the flag
    // This avoids hiding products when the DB records don't have isAvailable set.
    if (typeof isAvailable !== "undefined") {
      // accept string values "true" or "false"
      filter.isAvailable = isAvailable === "true";
    }

    // Filter by type
    if (_type) {
      filter._type = _type;
    }

    // Filter by brand
    if (brand) {
      filter.brand = brand;
    }

    // Filter by category
    if (category) {
      filter.category = category;
    }

    // Filter by offer
    if (offer === "true") {
      filter.offer = true;
    }

    // Filter by onSale
    if (onSale === "true") {
      filter.onSale = true;
    }

    // Search by name or description
    if (_search) {
      const searchRegex = new RegExp(_search, "i");
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } },
      ];
    }

    // Get database products
    let dbProducts;
    if (_type === "new_arrivals") {
      // Sort by createdAt descending for new arrivals
      dbProducts = await productModel.find(filter).sort({ createdAt: -1 });
    } else if (_type === "best_sellers") {
      // Sort by soldQuantity descending for best sellers
      dbProducts = await productModel.find(filter).sort({ soldQuantity: -1 });
    } else {
      // Default sort by createdAt descending
      dbProducts = await productModel.find(filter).sort({ createdAt: -1 });
    }

    // Format database products for frontend compatibility
    let formattedDbProducts = dbProducts.map((product) => ({
      ...product.toObject(),
      image:
        product.images && product.images.length > 0 ? product.images[0] : "",
    }));

    // Apply pagination
    const page = parseInt(_page, 10) || 1;
    const perPage = parseInt(_perPage, 10) || 25;
    const startIndex = (page - 1) * perPage;
    const endIndex = page * perPage;
    const paginatedProducts = formattedDbProducts.slice(startIndex, endIndex);

    // Return response based on whether pagination is requested
    if (_page || _perPage) {
      res.json({
        success: true,
        products: paginatedProducts,
        currentPage: page,
        perPage,
        totalItems: formattedDbProducts.length,
        totalPages: Math.ceil(formattedDbProducts.length / perPage),
      });
    } else {
      res.json({
        success: true,
        products: formattedDbProducts,
        total: formattedDbProducts.length,
      });
    }
  } catch (error) {
    console.log("List products error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Remove product
const removeProduct = async (req, res) => {
  try {
    // First, find the product to get its images
    const product = await productModel.findById(req.body._id);

    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    // Delete all product images from Cloudinary
    if (product.images && Array.isArray(product.images)) {
      for (const imageUrl of product.images) {
        try {
          const deleteResult = await deleteCloudinaryImage(imageUrl);
          if (deleteResult.success) {
            console.log("Product image deleted from Cloudinary successfully");
          } else {
            console.log(
              "Failed to delete product image:",
              deleteResult.message
            );
          }
        } catch (error) {
          console.log("Error deleting product image from Cloudinary:", error);
          // Continue with deletion even if some images fail
        }
      }
    }

    // Delete the product from database
      // Prevent deletion if product appears in any paid/confirmed/shipped/delivered orders
      // Match both ObjectId and string representations of productId
      const pid = product._id;
      const pidStr = String(product._id);
      const usedInOrder = await orderModel.exists({
        items: {
          $elemMatch: {
            $or: [
              { productId: pid },
              { productId: pidStr }
            ]
          }
        },
        $or: [
          { paymentStatus: "paid" },
          { status: { $in: ["confirmed", "shipped", "delivered"] } }
        ]
      });

      if (usedInOrder) {
        return res.json({ success: false, message: "Cannot delete product that has already been paid for / fulfilled in orders" });
      }

      await productModel.findByIdAndDelete(req.body._id);
      res.json({ success: true, message: "Product removed successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Single product
const singleProducts = async (req, res) => {
  try {
    const productId = req.body._id || req.query._id || req.params.id;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const product = await productModel.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Only return available products for non-admin requests
    if (!product.isAvailable && !req.user?.role === "admin") {
      return res.status(404).json({
        success: false,
        message: "Product not available",
      });
    }

    res.json({ success: true, product });
  } catch (error) {
    console.log("Single product error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Update stock after purchase
const updateStock = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Product ID and valid quantity are required",
      });
    }

    const product = await productModel.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock available",
      });
    }

    // Update stock only (soldQuantity is managed by orderStock.mjs)
    product.stock -= quantity;

    // If stock is 0, mark as unavailable
    if (product.stock === 0) {
      product.isAvailable = false;
    }

    await product.save();

    res.json({
      success: true,
      message: "Stock updated successfully",
      product: {
        _id: product._id,
        stock: product.stock,
        soldQuantity: product.soldQuantity,
        isAvailable: product.isAvailable,
      },
    });
  } catch (error) {
    console.log("Update stock error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get sold count for a product
const getProductSoldCount = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    // Find all orders that contain this product and meet the criteria
    const orders = await orderModel.find({
      "items.productId": productId,
      paymentStatus: "paid",
      status: { $in: ["confirmed", "shipped", "delivered"] },
    });

    // Calculate total sold quantity
    let totalSold = 0;
    orders.forEach((order) => {
      const item = order.items.find((i) => i.productId.toString() === productId);
      if (item) {
        totalSold += item.quantity || 0;
      }
    });

    res.json({
      success: true,
      soldCount: totalSold,
    });
  } catch (error) {
    console.log("Get sold count error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const {
      _type,
      name,
      price,
      discountedPercentage,
      stock,
      category,
      brand,
      badge,
      isAvailable,
      offer,
      description,
      tags,
      hasVariants,
      variants,
    } = req.body;

    const image1 = req.files?.image1 && req.files.image1[0];
    const image2 = req.files?.image2 && req.files.image2[0];
    const image3 = req.files?.image3 && req.files.image3[0];
    const image4 = req.files?.image4 && req.files.image4[0];

    // Find the existing product
    const existingProduct = await productModel.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check for required fields
    if (!name || !price || !category || !description) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: name, price, category, and description are mandatory.",
      });
    }

    let imagesUrl = existingProduct.images; // Keep existing images by default

    // If new images are uploaded, upload them to cloudinary
    const newImages = [image1, image2, image3, image4].filter(
      (item) => item !== undefined
    );

    if (newImages.length > 0) {
      try {
        const uploadPromises = newImages.map(async (item, index) => {
          const result = await cloudinary.uploader.upload(item.path, {
            folder: "orebi/products",
            resource_type: "image",
            transformation: [
              { width: 800, height: 800, crop: "fill" },
              { quality: "auto", fetch_format: "auto" },
            ],
          });

          // Clean up temporary file after successful upload
          cleanupTempFile(item.path);

          return { index, url: result.secure_url };
        });

        const uploadResults = await Promise.all(uploadPromises);

        // Update only the new image positions
        uploadResults.forEach(({ index, url }) => {
          if (index < imagesUrl.length) {
            imagesUrl[index] = url;
          } else {
            imagesUrl.push(url);
          }
        });
      } catch (error) {
        console.error("Error uploading images:", error);
        // Clean up temp files on error
        newImages.forEach((item) => cleanupTempFile(item.path));
        return res.status(500).json({
          success: false,
          message: "Error uploading images",
        });
      }
    }

    // Parse tags
    let parsedTags;
    try {
      parsedTags = JSON.parse(tags);
    } catch (err) {
      parsedTags = tags ? tags.split(",").map((tag) => tag.trim()) : [];
    }

    // Parse variants if provided
    let parsedVariants = [];
    if (variants) {
      try {
        parsedVariants = JSON.parse(variants);
      } catch (err) {
        console.error("Error parsing variants:", err);
      }
    }

    // Calculate total stock from variants if hasVariants is true
    let totalStock = stock ? Number(stock) : 0;
    if (hasVariants === "true" && parsedVariants.length > 0) {
      totalStock = parsedVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    }

    const updateData = {
      _type: _type || "",
      name,
      price: Number(price),
      discountedPercentage: discountedPercentage
        ? Number(discountedPercentage)
        : 10,
      stock: totalStock,
      category,
      brand: brand || "",
      badge: badge === "true" ? true : false,
      isAvailable: isAvailable === "true" ? true : false,
      offer: offer === "true" ? true : false,
      description,
      tags: parsedTags,
      images: imagesUrl,
      hasVariants: hasVariants === "true",
      variants: parsedVariants,
    };

    const updatedProduct = await productModel.findByIdAndUpdate(
      productId,
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      message: `${name} updated successfully`,
      product: updatedProduct,
    });
  } catch (error) {
    console.log("Update product error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Add variant to product
const addVariant = async (req, res) => {
  try {
    const { productId } = req.params;
    const { size, color, stock, variants } = req.body;

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if it's bulk add or single add
    if (variants && Array.isArray(variants)) {
      // Bulk add variants
      variants.forEach((v) => {
        product.variants.push({
          size: v.size,
          color: v.color,
          stock: Number(v.stock),
        });
      });

      product.hasVariants = true;
      product.stock = product.variants.reduce((sum, v) => sum + v.stock, 0);

      await product.save();

      res.json({
        success: true,
        message: `Added ${variants.length} variants successfully`,
        product,
      });
    } else {
      // Single add variant
      if (!productId || !size || !color || stock === undefined) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: size, color, and stock are required",
        });
      }

      // Add variant
      product.variants.push({
        size,
        color,
        stock: Number(stock),
      });

      // Set hasVariants to true
      product.hasVariants = true;

      // Update total stock
      product.stock = product.variants.reduce((sum, v) => sum + v.stock, 0);

      await product.save();

      res.json({
        success: true,
        message: "Variant added successfully",
        product,
      });
    }
  } catch (error) {
    console.log("Add variant error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Delete variant from product
const deleteVariant = async (req, res) => {
  try {
    const { productId, variantIndex } = req.params;

    if (!productId || variantIndex === undefined) {
      return res.status(400).json({
        success: false,
        message: "Product ID and variant index are required",
      });
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (variantIndex < 0 || variantIndex >= product.variants.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid variant index",
      });
    }

    // Remove variant
    product.variants.splice(variantIndex, 1);

    // Update hasVariants flag
    product.hasVariants = product.variants.length > 0;

    // Update total stock
    product.stock = product.variants.reduce((sum, v) => sum + v.stock, 0);

    await product.save();

    res.json({
      success: true,
      message: "Variant deleted successfully",
      product,
    });
  } catch (error) {
    console.log("Delete variant error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Update variant stock
const updateVariantStock = async (req, res) => {
  try {
    const { productId, variantIndex } = req.params;
    const { stock } = req.body;

    if (!productId || variantIndex === undefined || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: "Product ID, variant index, and stock are required",
      });
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (variantIndex < 0 || variantIndex >= product.variants.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid variant index",
      });
    }

    // Update variant stock
    product.variants[variantIndex].stock = Number(stock);

    // Update total stock
    product.stock = product.variants.reduce((sum, v) => sum + v.stock, 0);

    await product.save();

    res.json({
      success: true,
      message: "Variant stock updated successfully",
      product,
    });
  } catch (error) {
    console.log("Update variant stock error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Reset all stock to 0
const resetAllStock = async (req, res) => {
  try {
    const result = await productModel.updateMany(
      {},
      {
        stock: 0,
        variants: [],
        hasVariants: false,
      }
    );

    res.json({
      success: true,
      message: `Reset stock for ${result.modifiedCount} products to 0`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.log("Reset stock error:", error);
    res.json({ success: false, message: error.message });
  }
};

export {
  addProduct,
  listProducts,
  removeProduct,
  singleProducts,
  updateStock,
  updateProduct,
  getProductSoldCount,
  addVariant,
  deleteVariant,
  updateVariantStock,
  resetAllStock,
};
