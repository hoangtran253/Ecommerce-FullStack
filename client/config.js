const API_BASE_URL = (
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_SERVER_URL ||
  "http://localhost:8000"
).replace(/\/$/, "");

export const serverUrl = API_BASE_URL;

const checkConfig = (server) => {
  let config = {};
  switch (server) {
    case "production":
      config = {
        baseUrl: API_BASE_URL,
      };
      break;
    case "local":
      config = {
        baseUrl: API_BASE_URL,
      };
      break;
    default:
      config = {
        baseUrl: API_BASE_URL,
      };
      break;
  }
  return config;
};

export const selectServer = import.meta.env.DEV ? "local" : "production";
export const config = checkConfig(selectServer);
