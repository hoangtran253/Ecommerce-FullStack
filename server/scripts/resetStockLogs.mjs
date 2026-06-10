import mongoose from "mongoose";
import dotenv from "dotenv";
import stockLogModel from "../models/stockLogModel.js";

dotenv.config();

const resetStockLogs = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Target date: May 24, 2026
    const targetDate = new Date("2026-05-24T00:00:00.000Z");
    const targetDateEnd = new Date("2026-05-24T23:59:59.999Z");

    // Find all stock logs from May 24, 2026
    const logsFromTargetDate = await stockLogModel.find({
      createdAt: {
        $gte: targetDate,
        $lte: targetDateEnd,
      },
    }).sort({ createdAt: -1 });

    console.log(`Found ${logsFromTargetDate.length} logs from May 24, 2026`);

    if (logsFromTargetDate.length === 0) {
      console.log("No logs found from May 24, 2026");
      process.exit(0);
    }

    // Keep only the newest log from May 24, 2026
    const newestLog = logsFromTargetDate[0];
    const newestLogId = newestLog._id;

    console.log(`Newest log from May 24, 2026: ${newestLogId}`);

    // Delete all stock logs except the newest one from May 24, 2026
    const deleteResult = await stockLogModel.deleteMany({
      _id: { $ne: newestLogId },
    });

    console.log(`Deleted ${deleteResult.deletedCount} stock logs`);
    console.log(`Kept 1 stock log from May 24, 2026: ${newestLogId}`);

    process.exit(0);
  } catch (error) {
    console.error("Error resetting stock logs:", error);
    process.exit(1);
  }
};

resetStockLogs();
