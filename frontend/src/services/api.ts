// frontend/src/services/api.ts
import axios, { InternalAxiosRequestConfig } from "axios";

// 1. Get Base URL from environment variable or default
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api"; // Adjust port if needed

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // 2. IMPORTANT: Send cookies (like the refreshToken) with requests
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

// Implementation of a token refresh queue
let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetryAxiosRequestConfig;
    const isLoginOrRegister =
      originalRequest?.url === "/auth/login" ||
      originalRequest?.url === "/auth/register";

    if (
      error.response?.status === 401 &&
      originalRequest?.url !== "/auth/refresh-token" &&
      !originalRequest?._retry &&
      !isLoginOrRegister
    ) {
      originalRequest._retry = true;

      try {
        // Single refresh promise for multiple concurrent requests
        if (!refreshPromise) {
          refreshPromise = api
            .post<{ accessToken: string }>("/auth/refresh-token")
            .then((res) => res.data.accessToken)
            .finally(() => {
              refreshPromise = null;
            });
        }

        // All requests wait for the same refresh
        const newToken = await refreshPromise;

        // Update auth header and storage
        localStorage.setItem("accessToken", newToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;

        // Retry with new token
        return api(originalRequest);
      } catch (refreshError) {
        // Handle refresh failure
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        window.location.href = "/auth";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
