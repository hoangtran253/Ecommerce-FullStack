import express from "express";
const app = express();
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env from ./server/.env explicitly for environment configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "./.env") });
console.log("AI config:", {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "[REDACTED]" : null,
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
});

import cors from "cors";
import { readdirSync } from "fs";
import dbConnect from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";

const port = process.env.PORT;

const VERCEL_PROJECT_DOMAIN = "hoangtran253s-projects.vercel.app";

const VERCEL_REGEX = new RegExp(`^https:\\/\\/.*\\.${VERCEL_PROJECT_DOMAIN}$`); 

const allowedOrigins = [
  process.env.ADMIN_URL,
  process.env.CLIENT_URL,
  "https://ecommerce-full-stack-rust.vercel.app",
  "https://ecommerce-full-stack-fy44.vercel.app",
  "http://localhost:5174",
  "http://localhost:5173",
  "http://localhost:8081",
  "http://10.0.2.2:8081",
  "http://10.0.2.2:8000",
].filter(Boolean); 

console.log("Allowed CORS Origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        VERCEL_REGEX.test(origin)
      ) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "token"],
  })
);

app.use(express.json());

dbConnect();
connectCloudinary();


const routesPath = path.resolve(__dirname, "./routes");
const routeFiles = readdirSync(routesPath);
routeFiles.map(async (file) => {
  const routeModule = await import(`./routes/${file}`);
  app.use("/", routeModule.default);
});

app.get("/", (req, res) => {
  res.send("You should not be here");
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});