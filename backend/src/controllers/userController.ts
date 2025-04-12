// src/controllers/userController.ts

import { Request, Response } from "express";
import * as userService from "../services/userService";
import { User } from "@prisma/client"; // Optional: For stronger typing if needed

interface AuthenticatedRequest extends Request {
  userId?: string; // Should be guaranteed by authenticateToken middleware
}

//Gets the profile information for the authenticated user.

export const getUserProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const requestedUserId = req.params.id; // Get ID from URL parameter
    const authenticatedUserId = req.userId; // Get ID from auth token

    if (!authenticatedUserId) {
      console.error("Error: userId missing from request after authentication.");
      // Should ideally be caught by middleware, but good to check
      res.status(401).json({ message: "Authentication error" });
      return;
    }

    // 2. Authorization Check: Compare token ID with requested ID
    if (authenticatedUserId !== requestedUserId) {
      res.status(403).json({
        message: "Forbidden: You are not authorized to view this profile.",
      });
      return; // Stop execution if IDs don't match
    }

    // Fetch the user using the ID from the token payload
    const user = await userService.findById(authenticatedUserId);

    if (!user) {
      // This could happen if the user was deleted after the token was issued
      res.status(404).json({ message: "User not found" });
      return;
    }

    // IMPORTANT: Remove sensitive data before sending the response
    const { password_hash, ...userWithoutPassword } = user;

    // Send the sanitized user profile data
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error fetching profile" });
  }
};

// You can add other user-related controller functions here later, e.g.:
// export const updateUserProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => { ... };
