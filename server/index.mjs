import express from "express";
const app = express();
import "dotenv/config";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import { readdirSync } from "fs";
import dbConnect from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";

const port = process.env.PORT;

const VERCEL_PROJECT_DOMAIN = "hoangtran253s-projects.vercel.app";

const VERCEL_REGEX = new RegExp(`^https:\\/\\/.*\\.${VERCEL_PROJECT_DOMAIN}$`); 

const allowedOrigins = [
  process.env.ADMIN_URL,
  process.env.CLIENT_URL,
  "http://localhost:5174",
  "http://localhost:5173",
  "http://localhost:8081", // iOS simulator
  "http://10.0.2.2:8081", // Android emulator
  "http://10.0.2.2:8000", // Android emulator direct access
].filter(Boolean); // Lọc bỏ giá trị undefined từ biến môi trường

// CORS configuration sử dụng Regex
console.log("Allowed CORS Origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      console.log("CORS request from origin:", origin);

      // Cho phép các yêu cầu không có Origin (như Postman hoặc Mobile)
      if (!origin) { 
        console.log("No origin detected: allowing request.");
        return callback(null, true); 
      }

      // Kiểm tra xem Origin có trong danh sách cố định (localhost, domain chính) 
      // HOẶC có khớp với mẫu Regex Vercel (cho các URL deploy tạm thời)
      if (allowedOrigins.includes(origin) || VERCEL_REGEX.test(origin)) {
        console.log("Origin allowed:", origin);
        callback(null, true);
      } else {
        console.log("Origin blocked:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

dbConnect();
connectCloudinary();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routesPath = path.resolve(__dirname, "./routes");
const routeFiles = readdirSync(routesPath);
routeFiles.map(async (file) => {
  const routeModule = await import(`./routes/${file}`);
  app.use("/", routeModule.default);
});

app.get("/", (req, res) => {
  res.send("You should not be here");
});

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});