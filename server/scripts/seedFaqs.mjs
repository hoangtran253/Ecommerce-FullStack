import dotenv from "dotenv";
import connectDB from "../config/mongodb.js";
import faqModel from "../models/faqModel.js";
import { FAQ_ENTRIES } from "../data/chatKnowledge.mjs";

dotenv.config();

const CATEGORY_MAP = {
  "giao hàng": "shipping",
  "đổi trả": "return",
  "thanh toán": "payment",
  size: "product",
  "bảo hành": "product",
  "khuyến mãi": "other",
  "hàng chính hãng": "product",
  freeship: "shipping",
  "tư vấn": "other",
  "đặt hàng": "other",
  "hủy đơn": "return",
  kho: "product",
};

const resolveCategory = (keys) => {
  for (const [prefix, category] of Object.entries(CATEGORY_MAP)) {
    if (keys.some((k) => k.toLowerCase().includes(prefix))) return category;
  }
  return "general";
};

await connectDB();

let created = 0;
let updated = 0;

for (let i = 0; i < FAQ_ENTRIES.length; i++) {
  const entry = FAQ_ENTRIES[i];
  const existing = await faqModel.findOne({
    keys: { $all: [entry.keys[0]] },
  });

  const payload = {
    keys: entry.keys,
    answer: entry.answer,
    category: resolveCategory(entry.keys),
    isActive: true,
    priority: FAQ_ENTRIES.length - i,
  };

  if (existing) {
    await faqModel.updateOne({ _id: existing._id }, { $set: payload });
    updated++;
  } else {
    await faqModel.create(payload);
    created++;
  }
}

console.log(`FAQ seed done: ${created} created, ${updated} updated`);
process.exit(0);
