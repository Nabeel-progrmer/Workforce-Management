import axios from "axios";

// Determine the API base URL. Prefer the VITE_API_URL environment variable if set.
// Fallback to the production backend URL.
const configuredApiUrl = import.meta.env.VITE_API_URL;
const fallbackApiUrl = "https://workforce-backend-rk7c.vercel.app/api";
// In development, allow overriding with a localhost URL via VITE_API_URL.
const apiUrl = configuredApiUrl ? configuredApiUrl : fallbackApiUrl;
// Log the selected API URL for debugging purposes (remove in production builds)
if (import.meta.env.DEV) {
  console.log("[API] Using base URL:", apiUrl);
}

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (
        window.location.pathname !== "/login"
      ) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;