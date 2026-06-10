import fs from "fs";
import Contact from "../models/contactModel.js";
import { cloudinary } from "../config/cloudinary.js";
import {
  STORE_CONTACT_INFO,
  getMapEmbedUrl,
} from "../utils/contactInfo.mjs";

const cleanupTempFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.error("cleanupTempFile:", err?.message);
  }
};

const uploadContactImages = async (files = []) => {
  const urls = [];
  for (const file of files) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "orebi/contacts",
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      });
      urls.push(result.secure_url);
    } finally {
      cleanupTempFile(file.path);
    }
  }
  return urls;
};

/** GET /api/contact/info — thông tin liên hệ cửa hàng (public) */
export const getContactInfo = async (req, res) => {
  try {
    res.json({
      success: true,
      info: {
        ...STORE_CONTACT_INFO,
        mapEmbedUrl: getMapEmbedUrl(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new contact message (khách hoặc user đăng nhập)
export const createContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const userId = req.user?._id || req.user?.id || null;

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập tin nhắn",
      });
    }

    const emailToUse = req.user?.email
      ? req.user.email.trim().toLowerCase()
      : email?.trim().toLowerCase();

    if (!emailToUse) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập email",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToUse)) {
      return res.status(400).json({
        success: false,
        message: "Email không hợp lệ",
      });
    }

    const nameToUse = req.user?.name
      ? req.user.name.trim()
      : name?.trim();

    if (!nameToUse) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập họ tên",
      });
    }

    const imageUrls = await uploadContactImages(req.files || []);

    const contact = new Contact({
      name: nameToUse,
      email: emailToUse,
      subject: (subject || "Liên hệ từ website").trim(),
      message: message.trim(),
      images: imageUrls,
      userId: userId || undefined,
    });

    await contact.save();

    if (userId) {
      await contact.populate("userId", "name email avatar");
    }

    res.status(201).json({
      success: true,
      message: "Gửi tin nhắn thành công! Chúng tôi sẽ phản hồi sớm nhất.",
      data: contact,
    });
  } catch (error) {
    console.error("Create contact error:", error);

    // Handle specific mongoose errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to send message. Please try again.",
    });
  }
};

// Get all contact messages (for admin)
export const getAllContacts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    // Build filter object
    const filter = {};
    if (status && status !== "all") {
      filter.status = status;
    }

    // Search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    const contacts = await Contact.find(filter)
      .populate("userId", "name email avatar")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Contact.countDocuments(filter);

    // Get status counts for dashboard
    const statusCounts = await Contact.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {
      unread: 0,
      read: 0,
      replied: 0,
      total,
    };

    statusCounts.forEach((item) => {
      counts[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      data: contacts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
      counts,
    });
  } catch (error) {
    console.error("Get contacts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contacts",
    });
  }
};

// Get single contact message (for admin)
export const getContactById = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findById(id).populate("userId", "name email avatar");

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error("Get contact by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contact message",
    });
  }
};

// Update contact status / ghi chú nội bộ (admin)
export const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tin nhắn",
      });
    }

    if (status && !["unread", "read", "replied"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ",
      });
    }

    if (status) contact.status = status;
    if (adminNotes !== undefined) contact.adminNotes = String(adminNotes).trim();

    await contact.save();
    await contact.populate("userId", "name email avatar");

    const payload = contact.toObject ? contact.toObject() : contact;

    res.status(200).json({
      success: true,
      message: "Cập nhật thành công",
      data: payload,
    });
  } catch (error) {
    console.error("Update contact status error:", error);
    res.status(500).json({
      success: false,
      message: "Cập nhật thất bại",
    });
  }
};

/** PUT /api/contact/admin/:id/reply — shop trả lời khách */
export const replyToContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminReply } = req.body;

    if (!adminReply?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập nội dung trả lời",
      });
    }

    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tin nhắn",
      });
    }

    contact.adminReply = adminReply.trim();
    contact.status = "replied";
    contact.repliedAt = new Date();
    await contact.save();
    await contact.populate("userId", "name email avatar");

    const payload = contact.toObject ? contact.toObject() : contact;

    res.status(200).json({
      success: true,
      message: "Đã gửi trả lời cho khách",
      data: payload,
    });
  } catch (error) {
    console.error("replyToContact error:", error);
    res.status(500).json({
      success: false,
      message: "Gửi trả lời thất bại",
    });
  }
};

// Delete contact message (for admin)
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Contact message deleted successfully",
    });
  } catch (error) {
    console.error("Delete contact error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete contact message",
    });
  }
};

// Get user's own contact messages (for authenticated users)
export const getUserContacts = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userEmail = (req.user.email || "").trim().toLowerCase();

    if (userEmail) {
      await Contact.updateMany(
        {
          email: userEmail,
          $or: [{ userId: null }, { userId: { $exists: false } }],
        },
        { $set: { userId } }
      );
    }

    const orConditions = [{ userId }];
    if (userEmail) {
      orConditions.push({ email: userEmail });
    }

    const contacts = await Contact.find({ $or: orConditions })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const hasReply = (c) => Boolean(String(c.adminReply || "").trim());

    const replied = contacts.filter(hasReply);
    const sent = contacts.filter((c) => !hasReply(c));

    res.status(200).json({
      success: true,
      data: contacts,
      sent,
      replied,
    });
  } catch (error) {
    console.error("Get user contacts error:", error);
    res.status(500).json({
      success: false,
      message: "Không tải được tin nhắn của bạn",
    });
  }
};
