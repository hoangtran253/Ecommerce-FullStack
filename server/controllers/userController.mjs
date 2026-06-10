import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import {
  hydrateCartItems,
  itemsToCartMap,
  buildCartKey,
} from "../utils/userCart.mjs";
import { REGISTERED_CUSTOMER_FILTER } from "../utils/userStats.mjs";
import { sendLoginNotification, sendWelcomeEmail } from "../utils/emailService.mjs";
import { cloudinary, deleteCloudinaryImage } from "../config/cloudinary.js";
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

const createToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

const formatAuthUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar || "",
});

// Route for user login
const userLogin = async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const { password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "Tài khoản không tồn tại" });
    }

    if (!user.isActive) {
      return res.json({ success: false, message: "Tài khoản đã bị vô hiệu hóa" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      user.lastLogin = new Date();
      await user.save();

      const token = createToken(user);
      sendLoginNotification(user).catch((e) =>
        console.error("login email:", e)
      );

      res.json({
        success: true,
        token,
        user: formatAuthUser(user),
        message: "Đăng nhập thành công",
      });
    } else {
      res.json({ success: false, message: "Email hoặc mật khẩu không đúng" });
    }
  } catch (error) {
    console.log("User Login Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Route for user registration
const userRegister = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "user",
      address,
      isActive = true,
      avatar = "",
    } = req.body;
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "User already exists" });
    }

    // Validating email format & strong password
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Password length should be equal or greater than 8",
      });
    }

    // Only allow admin role creation if the request comes from an admin
    if (role === "admin" && (!req.user || req.user.role !== "admin")) {
      return res.json({
        success: false,
        message: "Only admins can create admin accounts",
      });
    }

    // Hashing user password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      role: role,
      isActive: isActive,
      avatar: avatar || "",
      address: address || {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        phone: "",
      },
    });

    const user = await newUser.save();

    const token = createToken(user);
    sendWelcomeEmail(user).catch((e) => console.error("welcome email:", e));

    res.json({
      success: true,
      token,
      user: formatAuthUser(user),
      message: "Đăng ký thành công!",
    });
  } catch (error) {
    console.log("User Register Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Route for admin login (now uses role-based authentication)
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User doesn't exist" });
    }

    if (user.role !== "admin") {
      return res.json({ success: false, message: "Admin access required" });
    }

    if (!user.isActive) {
      return res.json({ success: false, message: "Account is deactivated" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      // Update last login
      user.lastLogin = new Date();
      await user.save();

      const token = createToken(user);
      res.json({
        success: true,
        token,
        user: formatAuthUser(user),
        message: "Welcome admin",
      });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log("Admin Login Error", error);
    res.json({ success: false, message: error.message });
  }
};

const removeUser = async (req, res) => {
  try {
    // First, find the user to get their avatar URL
    const user = await userModel.findById(req.body._id);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Delete user's avatar from Cloudinary if exists
    if (user.avatar) {
      try {
        const deleteResult = await deleteCloudinaryImage(user.avatar);
        if (deleteResult.success) {
          console.log("User avatar deleted from Cloudinary successfully");
        } else {
          console.log(
            "Failed to delete user avatar from Cloudinary:",
            deleteResult.message
          );
        }
      } catch (error) {
        console.log("Error deleting user avatar from Cloudinary:", error);
        // Continue with user deletion even if avatar deletion fails
      }
    }

    // Delete the user from database
    await userModel.findByIdAndDelete(req.body._id);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.log("Removed user Error", error);
    res.json({ success: false, message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = req.params.id || req.body._id;
    const { name, email, password, role, avatar, addresses, isActive } =
      req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (name) user.name = name;
    if (email) {
      if (!validator.isEmail(email)) {
        return res.json({
          success: false,
          message: "Please enter a valid email address",
        });
      }
      user.email = email;
    }

    if (role) {
      // Only allow admin role updates if the requesting user is admin
      if (role === "admin" && (!req.user || req.user.role !== "admin")) {
        return res.json({
          success: false,
          message: "Only admins can assign admin role",
        });
      }
      user.role = role;
    }

    // Handle avatar update
    if (avatar !== undefined && avatar !== user.avatar) {
      if (user.avatar) {
        try {
          await deleteCloudinaryImage(user.avatar);
        } catch (err) {
          console.log("Old avatar delete skipped:", err?.message);
        }
      }
      user.avatar = avatar;
    }

    // Handle new addresses array
    if (addresses) {
      user.addresses = addresses;
    }

    // Handle isActive field - only admins can change account status
    if (isActive !== undefined && req.user && req.user.role === "admin") {
      user.isActive = isActive;
    }

    if (password) {
      if (password.length < 8) {
        return res.json({
          success: false,
          message: "Password length should be equal or greater than 8",
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.json({
      success: true,
      message: "User updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.log("Update user Error", error);
    res.json({ success: false, message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 500, role } = req.query;
    const parsedLimit = Math.min(parseInt(limit, 10) || 500, 500);
    const skip = (parseInt(page, 10) - 1) * parsedLimit;

    let filter = {};
    if (role) {
      filter.role = role;
    }

    const [total, customerTotal, adminTotal, users] = await Promise.all([
      userModel.countDocuments(filter),
      userModel.countDocuments(REGISTERED_CUSTOMER_FILTER),
      userModel.countDocuments({ role: "admin" }),
      userModel
        .find(filter)
        .select("-password")
        .populate("orders")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),
    ]);

    res.json({
      success: true,
      total,
      customerTotal,
      adminTotal,
      users,
      currentPage: parseInt(page, 10),
      totalPages: Math.ceil(total / parsedLimit),
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Address Management Functions
/** Admin routes: :userId in params. User routes: own account from token. */
const resolveAddressTargetUserId = (req) => {
  if (req.params?.userId) return req.params.userId;
  return req.user?.id || req.user?._id;
};

// Add new address for user
const addAddress = async (req, res) => {
  try {
    const targetUserId = resolveAddressTargetUserId(req);

    const { label, street, city, state, zipCode, country, phone, isDefault } =
      req.body;

    // Validate required fields
    if (!label || !street || !city || !state || !country || !phone) {
      return res.json({
        success: false,
        message:
          "All address fields are required (label, street, city, state, country, phone)",
      });
    }

    const user = await userModel.findById(targetUserId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // If this is being set as default, remove default from other addresses
    if (isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    // If this is the first address, make it default
    const newAddress = {
      label,
      street,
      city,
      state,
      zipCode,
      country,
      phone: phone || "",
      isDefault: isDefault || user.addresses.length === 0,
    };

    user.addresses.push(newAddress);
    await user.save();

    res.json({
      success: true,
      message: "Address added successfully",
      address: newAddress,
    });
  } catch (error) {
    console.log("Add Address Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Update existing address
const updateAddress = async (req, res) => {
  try {
    const targetUserId = resolveAddressTargetUserId(req);
    const { addressId } = req.params;
    const { label, street, city, state, zipCode, country, phone, isDefault } =
      req.body;

    const user = await userModel.findById(targetUserId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === addressId
    );
    if (addressIndex === -1) {
      return res.json({ success: false, message: "Address not found" });
    }

    // If setting as default, remove default from other addresses
    if (isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    // Update the address
    const updatedAddress = {
      ...user.addresses[addressIndex].toObject(),
      label: label || user.addresses[addressIndex].label,
      street: street || user.addresses[addressIndex].street,
      city: city || user.addresses[addressIndex].city,
      state: state || user.addresses[addressIndex].state,
      zipCode: zipCode || user.addresses[addressIndex].zipCode,
      country: country || user.addresses[addressIndex].country,
      phone: phone !== undefined ? phone : user.addresses[addressIndex].phone,
      isDefault:
        isDefault !== undefined
          ? isDefault
          : user.addresses[addressIndex].isDefault,
    };

    user.addresses[addressIndex] = updatedAddress;
    await user.save();

    res.json({
      success: true,
      message: "Address updated successfully",
      address: updatedAddress,
    });
  } catch (error) {
    console.log("Update Address Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Delete address
const deleteAddress = async (req, res) => {
  try {
    const targetUserId = resolveAddressTargetUserId(req);
    const { addressId } = req.params;

    const user = await userModel.findById(targetUserId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === addressId
    );
    if (addressIndex === -1) {
      return res.json({ success: false, message: "Address not found" });
    }

    const wasDefault = user.addresses[addressIndex].isDefault;
    user.addresses.splice(addressIndex, 1);

    // If deleted address was default and there are remaining addresses, make the first one default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.log("Delete Address Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Set default address
const setDefaultAddress = async (req, res) => {
  try {
    const targetUserId = resolveAddressTargetUserId(req);
    const { addressId } = req.params;

    const user = await userModel.findById(targetUserId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === addressId
    );
    if (addressIndex === -1) {
      return res.json({ success: false, message: "Address not found" });
    }

    // Remove default from all addresses and set the specified one as default
    user.addresses.forEach((addr) => (addr.isDefault = false));
    user.addresses[addressIndex].isDefault = true;

    await user.save();

    res.json({
      success: true,
      message: "Default address updated successfully",
    });
  } catch (error) {
    console.log("Set Default Address Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Get user addresses
const getUserAddresses = async (req, res) => {
  try {
    const targetUserId = resolveAddressTargetUserId(req);

    const user = await userModel.findById(targetUserId).select("addresses");
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      addresses: user.addresses || [],
    });
  } catch (error) {
    console.log("Get Addresses Error", error);
    res.json({ success: false, message: error.message });
  }
};

const uploadAvatarToCloudinary = async (filePath) => {
  const uploadResult = await cloudinary.uploader.upload(filePath, {
    folder: "orebi/users",
    resource_type: "image",
    transformation: [
      { width: 400, height: 400, crop: "fill", gravity: "face" },
      { quality: "auto", fetch_format: "auto" },
    ],
  });
  return uploadResult.secure_url;
};

// Admin: upload avatar file, return URL (saved when admin updates user)
const uploadUserAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ success: false, message: "No file uploaded" });
    }

    const avatarUrl = await uploadAvatarToCloudinary(req.file.path);
    cleanupTempFile(req.file.path);

    res.json({
      success: true,
      message: "Avatar uploaded successfully",
      avatarUrl,
    });
  } catch (error) {
    console.log("Avatar upload error", error);
    if (req.file?.path) cleanupTempFile(req.file.path);
    res.json({ success: false, message: error.message });
  }
};

// User: upload and save avatar to own profile
const uploadMyAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ success: false, message: "No file uploaded" });
    }

    const user = await userModel.findById(req.user._id || req.user.id);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const avatarUrl = await uploadAvatarToCloudinary(req.file.path);
    cleanupTempFile(req.file.path);

    if (user.avatar && user.avatar !== avatarUrl) {
      try {
        await deleteCloudinaryImage(user.avatar);
      } catch (err) {
        console.log("Old avatar delete skipped:", err?.message);
      }
    }

    user.avatar = avatarUrl;
    await user.save();

    res.json({
      success: true,
      message: "Cập nhật ảnh đại diện thành công",
      avatarUrl,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone:
          user.addresses && user.addresses[0] ? user.addresses[0].phone : "",
        address:
          user.addresses && user.addresses[0] ? user.addresses[0].street : "",
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.log("Upload my avatar error", error);
    if (req.file?.path) cleanupTempFile(req.file.path);
    res.json({ success: false, message: error.message });
  }
};

export {
  userLogin,
  userRegister,
  adminLogin,
  getUsers,
  removeUser,
  updateUser,
  getUserProfile,
  updateUserProfile,
  addToCart,
  updateCart,
  getUserCart,
  syncUserCart,
  clearCart,
  createAdmin,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getUserAddresses,
  uploadUserAvatar,
  uploadMyAvatar,
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await userModel
      .findById(req.user.id)
      .select("-password")
      .populate("orders");

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const userProfile = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.addresses && user.addresses[0] ? user.addresses[0].phone : "",
      address:
        user.addresses && user.addresses[0] ? user.addresses[0].street : "",
      avatar: user.avatar,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      isActive: user.isActive,
      orders: user.orders,
      addresses: user.addresses,
    };

    res.json({ success: true, user: userProfile });
  } catch (error) {
    console.log("Get Profile Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const { name, email, phone, address, avatar } = req.body;
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (name) user.name = name;
    // Email không đổi qua hồ sơ — dùng tài khoản đăng ký

    if (avatar !== undefined && avatar !== user.avatar) {
      if (user.avatar) {
        try {
          await deleteCloudinaryImage(user.avatar);
        } catch (err) {
          console.log("Old avatar delete skipped:", err?.message);
        }
      }
      user.avatar = avatar;
    }

    // Handle phone and address - update the first address or create one
    if (phone !== undefined || address !== undefined) {
      if (!user.addresses || user.addresses.length === 0) {
        user.addresses = [
          {
            label: "Địa chỉ chính",
            street: address || "",
            city: "",
            state: "",
            zipCode: "",
            country: "Việt Nam",
            phone: phone || "",
            isDefault: true,
          },
        ];
      } else {
        const primary =
          user.addresses.find((a) => a.isDefault) || user.addresses[0];
        if (phone !== undefined) primary.phone = phone;
        if (address !== undefined) primary.street = address;
        if (!primary.label) primary.label = "Địa chỉ chính";
      }
    }

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone:
          user.addresses && user.addresses[0] ? user.addresses[0].phone : "",
        address:
          user.addresses && user.addresses[0] ? user.addresses[0].street : "",
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.log("Update Profile Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, size } = req.body;
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const cartKey = buildCartKey(productId, size);

    if (user.userCart[cartKey]) {
      user.userCart[cartKey] += quantity;
    } else {
      user.userCart[cartKey] = quantity;
    }

    await user.save();

    res.json({
      success: true,
      message: "Item added to cart",
      cart: user.userCart,
    });
  } catch (error) {
    console.log("Add to Cart Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Update cart item
const updateCart = async (req, res) => {
  try {
    const { productId, quantity, size } = req.body;
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const cartKey = buildCartKey(productId, size);

    if (quantity <= 0) {
      delete user.userCart[cartKey];
    } else {
      user.userCart[cartKey] = quantity;
    }

    await user.save();

    res.json({
      success: true,
      message: "Cart updated successfully",
      cart: user.userCart,
    });
  } catch (error) {
    console.log("Update Cart Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Get user cart (full product lines for client)
const getUserCart = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const cartMap = user.userCart || {};
    const items = await hydrateCartItems(cartMap);

    res.json({
      success: true,
      items,
      cart: cartMap,
    });
  } catch (error) {
    console.log("Get Cart Error", error);
    res.json({ success: false, message: error.message });
  }
};

/** PUT /api/user/cart/sync — lưu giỏ đầy đủ theo tài khoản */
const syncUserCart = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    user.userCart = itemsToCartMap(req.body.items || []);
    user.markModified("userCart");
    await user.save();

    const items = await hydrateCartItems(user.userCart);

    res.json({
      success: true,
      message: "Cart synced",
      items,
      cart: user.userCart,
    });
  } catch (error) {
    console.log("Sync Cart Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Clear user cart
const clearCart = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    user.userCart = {};
    await user.save();

    res.json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    console.log("Clear Cart Error", error);
    res.json({ success: false, message: error.message });
  }
};

// Create admin user (only accessible by existing admins)
const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if requesting user is admin
    if (req.user.role !== "admin") {
      return res.json({ success: false, message: "Admin access required" });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "User already exists" });
    }

    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Password length should be equal or greater than 8",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new userModel({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });

    const admin = await newAdmin.save();

    res.json({
      success: true,
      message: "Admin created successfully!",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.log("Create Admin Error", error);
    res.json({ success: false, message: error.message });
  }
};
