import faqModel from "../models/faqModel.js";

export const createFaq = async (req, res) => {
  try {
    const { keys, answer, category, isActive, priority } = req.body;
    
    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({ success: false, message: "Keys are required" });
    }
    
    if (!answer) {
      return res.status(400).json({ success: false, message: "Answer is required" });
    }
    
    const faq = await faqModel.create({
      keys,
      answer,
      category: category || "general",
      isActive: isActive !== undefined ? isActive : true,
      priority: priority || 0,
    });
    
    res.status(201).json({ success: true, message: "FAQ created successfully", data: faq });
  } catch (error) {
    console.error("Error creating FAQ:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to create FAQ" });
  }
};

export const getFaqs = async (req, res) => {
  try {
    const { category, isActive } = req.query;
    const filter = {};
    
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === "true";
    
    const faqs = await faqModel.find(filter).sort({ priority: -1, createdAt: -1 });
    
    res.status(200).json({ success: true, data: faqs });
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch FAQs" });
  }
};

export const getFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await faqModel.findById(id);
    
    if (!faq) {
      return res.status(404).json({ success: false, message: "FAQ not found" });
    }
    
    res.status(200).json({ success: true, data: faq });
  } catch (error) {
    console.error("Error fetching FAQ:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch FAQ" });
  }
};

export const updateFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const { keys, answer, category, isActive, priority } = req.body;
    
    const faq = await faqModel.findById(id);
    if (!faq) {
      return res.status(404).json({ success: false, message: "FAQ not found" });
    }
    
    if (keys) faq.keys = keys;
    if (answer) faq.answer = answer;
    if (category !== undefined) faq.category = category;
    if (isActive !== undefined) faq.isActive = isActive;
    if (priority !== undefined) faq.priority = priority;
    
    await faq.save();
    
    res.status(200).json({ success: true, message: "FAQ updated successfully", data: faq });
  } catch (error) {
    console.error("Error updating FAQ:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to update FAQ" });
  }
};

export const deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await faqModel.findById(id);
    
    if (!faq) {
      return res.status(404).json({ success: false, message: "FAQ not found" });
    }
    
    await faqModel.findByIdAndDelete(id);
    
    res.status(200).json({ success: true, message: "FAQ deleted successfully" });
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to delete FAQ" });
  }
};

export const getActiveFaqsForChatbot = async (req, res) => {
  try {
    const faqs = await faqModel.find({ isActive: true }).sort({ priority: -1, createdAt: -1 });
    
    const formattedFaqs = faqs.map(faq => ({
      keys: faq.keys,
      answer: faq.answer,
    }));
    
    res.status(200).json({ success: true, data: formattedFaqs });
  } catch (error) {
    console.error("Error fetching active FAQs for chatbot:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch FAQs" });
  }
};
