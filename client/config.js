const VERCEL_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
export const serverUrl = VERCEL_BACKEND_URL || "http://localhost:8000";

const checkConfig = (server) => {
  let config = {};
  switch (server) {
    case "production": 
      config = {
        baseUrl: VERCEL_BACKEND_URL, // SỬ DỤNG BIẾN MÔI TRƯỜNG
      };
      break;
    case "local":
      config = {
        baseUrl: "http://localhost:8000",
      };
      break;
    default:
      break;
  }
  return config;
};

export const selectServer = "production"; 
export const config = checkConfig(selectServer);