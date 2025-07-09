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
    throw new Error(error.response?.data?.message || "Failed to fetch user");
  }
};

export const updateUserProfile = async (profileData: any) => {
  try {
    const response = await api.put("/users/profile", profileData);
    return response.data;
  } catch (error: any) {
    // More specific error handling
    if (error.response?.status === 409) {
      throw new Error("This email is already in use by another account.");
    }
    throw new Error(
      error.response?.data?.message ||
        "An error occurred while updating your profile."
    );
  }
};

export const changePassword = async (
  oldPassword: string,
  newPassword: string
) => {
  try {
    const response = await api.put("/users/profile/change-password", {
      oldPassword,
      newPassword,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
        "An error occurred while changing your password."
    );
  }
};
