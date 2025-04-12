// frontend/src/services/userService.ts
import api from "./api";
import axios from "axios";
import { UserProfileData, ApiErrorData } from "../types";

// Function to get the profile for a given user ID
// Backend controller ensures authorization (authenticated user matches requested ID)
export const getUserProfile = async (
  userId: string
): Promise<UserProfileData> => {
  try {
    const response = await api.get<UserProfileData>(`/users/profile/${userId}`);
    return response.data;
  } catch (error: unknown) {
    let errorMessage = "Failed to fetch user profile.";
    if (axios.isAxiosError<ApiErrorData>(error)) {
      errorMessage =
        error.response?.data?.message || error.message || errorMessage;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("API Get Profile Error:", errorMessage);
    throw new Error(errorMessage);
  }
};
