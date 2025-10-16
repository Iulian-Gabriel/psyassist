// frontend/src/services/api.ts
import axios, { InternalAxiosRequestConfig } from "axios";

// Determine the API URL
const getApiUrl = (): string => {
  if (typeof window === "undefined") {
    return "http://localhost:4000/api";
  }

  const hostname = window.location.hostname;
  
  // Codespaces environment
  if (hostname.includes("app.github.dev")) {
    const backendUrl = `https://${hostname.replace(/-5173/, "-4000")}/api`;
    console.log("🔗 Codespaces API URL:", backendUrl);
    return backendUrl;
  }

  // Local development
  const localUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
  console.log("🔗 Local API URL:", localUrl);
  return localUrl;
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// 3. Request Interceptor: Attach Access Token to Headers
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("accessToken"); // Get token from storage
    // config.headers is guaranteed to exist by Axios types here
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => {
    // Handle request setup errors (rare)
    console.error("Request Interceptor Error:", error);
    return Promise.reject(error);
  }
);

// Add a custom property to Axios config to prevent retry loops
interface RetryAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Replace the existing interceptor.response section with this improved version

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetryAxiosRequestConfig;

    // Check if we got a 401 Unauthorized error
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest?.url !== "/auth/refresh-token" &&
      originalRequest?.url !== "/auth/login" &&
      originalRequest?.url !== "/auth/register"
    ) {
      originalRequest._retry = true;

      try {
        console.log("Token expired, attempting refresh...");
        const response = await axios.post(
          `${API_URL}/auth/refresh-token`,
          {},
          {
            withCredentials: true,
          }
        );

        const newToken = response.data.accessToken;

        if (newToken) {
          // Update token in localStorage
          localStorage.setItem("accessToken", newToken);

          // Update Authorization header
          api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
          originalRequest.headers["Authorization"] = `Bearer ${newToken}`;

          // Retry the original request with the new token
          return axios(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Clear authentication data
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");

        // Redirect to login
        window.location.href = "/auth";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
