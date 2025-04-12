// frontend/src/services/authService.ts
import api from "./api";
import axios from "axios";
import {
  LoginCredentials,
  RegisterFormData,
  AuthResponse,
  ApiErrorData,
} from "../types";

// Define the structure expected by the backend register endpoint (snake_case)
interface BackendRegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  date_of_birth: string; // Expects YYYY-MM-DD string
  // Add optional fields if needed (gender, phone_number, etc.)
}

export const loginUser = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>("/auth/login", credentials);
    if (response.data.accessToken && response.data.user) {
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    } else {
      // Throw if response structure is unexpected
      throw new Error("Invalid login response structure from server.");
    }
    return response.data;
  } catch (error: unknown) {
    let errorMessage = "Login failed. Please try again.";
    if (axios.isAxiosError<ApiErrorData>(error)) {
      errorMessage =
        error.response?.data?.message || error.message || errorMessage;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("API Login Error:", errorMessage);
    throw new Error(errorMessage);
  }
};

// Takes frontend form data (camelCase) and maps to backend (snake_case)
export const registerUser = async (
  userData: RegisterFormData
): Promise<AuthResponse> => {
  // Map frontend camelCase to backend snake_case
  const backendData: BackendRegisterData = {
    email: userData.email,
    password: userData.password,
    first_name: userData.firstName,
    last_name: userData.lastName,
    date_of_birth: userData.dob, // Pass DOB string directly
    // Map other fields if necessary
  };

  try {
    const response = await api.post<AuthResponse>(
      "/auth/register",
      backendData
    );
    // Backend registers AND logs in, so store token/user data
    if (response.data.accessToken && response.data.user) {
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    } else {
      throw new Error("Invalid registration response structure from server.");
    }
    return response.data;
  } catch (error: unknown) {
    let errorMessage = "Registration failed. Please try again.";
    if (axios.isAxiosError<ApiErrorData>(error)) {
      errorMessage =
        error.response?.data?.message || error.message || errorMessage;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("API Register Error:", errorMessage);
    throw new Error(errorMessage);
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    // Call the backend logout endpoint (clears HttpOnly cookie)
    await api.post("/auth/logout");
  } catch (error: unknown) {
    let errorMessage = "Logout API call failed.";
    if (axios.isAxiosError<ApiErrorData>(error)) {
      errorMessage =
        error.response?.data?.message || error.message || errorMessage;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("API Logout Error:", errorMessage, error);
    // Don't rethrow here, proceed to local cleanup
  } finally {
    // Always clear local storage and default headers on logout attempt
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
    // Redirect is handled by context or component after calling this
  }
};
