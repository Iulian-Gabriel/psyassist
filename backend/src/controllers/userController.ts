// src/controllers/userController.ts

import { Request, Response } from "express";
import * as userService from "../services/userService";
import { User } from "@prisma/client"; // Optional: For stronger typing if needed
import prisma from "../utils/prisma"; // Add this import

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

// Backend route handler for GET /users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// Add this to your userController.ts
export const deactivateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      res.status(400).json({ message: "Invalid user ID" });
      return;
    }

    await prisma.user.update({
      where: { user_id: userId },
      data: { is_active: false },
    });

    res.json({ message: "User deactivated successfully" });
  } catch (error) {
    console.error("Error deactivating user:", error);
    res.status(500).json({ message: "Failed to deactivate user" });
  }
};

// Add a new function to reactivate users
export const reactivateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      res.status(400).json({ message: "Invalid user ID" });
      return;
    }

    await prisma.user.update({
      where: { user_id: userId },
      data: { is_active: true },
    });

    res.json({ message: "User reactivated successfully" });
  } catch (error) {
    console.error("Error reactivating user:", error);
    res.status(500).json({ message: "Failed to reactivate user" });
  }
};

// Get a single user by ID (for admin view)
export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      res.status(400).json({ message: "Invalid user ID" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Remove sensitive data before sending response
    const { password_hash, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

// Modify the updateUser function to handle role updates

export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      res.status(400).json({ message: "Invalid user ID" });
      return;
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!userExists) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Extract fields from request body
    const {
      email,
      first_name,
      last_name,
      date_of_birth,
      gender,
      phone_number,
      address_street,
      address_city,
      address_postal_code,
      address_country,
      address_county,
      roles,
    } = req.body;

    // Update in a transaction to handle both user data and roles
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update user data
      const user = await tx.user.update({
        where: { user_id: userId },
        data: {
          email,
          first_name,
          last_name,
          date_of_birth: date_of_birth ? new Date(date_of_birth) : undefined,
          gender,
          phone_number,
          address_street,
          address_city,
          address_postal_code,
          address_country,
          address_county,
        },
      });

      // Update roles if provided - handle as single role selection
      if (Array.isArray(roles) && roles.length > 0) {
        // First, delete all existing roles
        await tx.userRoles.deleteMany({
          where: { user_id: userId },
        });

        // Add the selected role (just the first one)
        await tx.userRoles.create({
          data: {
            user_id: userId,
            role_id: roles[0],
          },
        });
      }

      return user;
    });

    // Remove sensitive data before sending response
    const { password_hash, ...userWithoutPassword } = updatedUser;

    res.json({
      message: "User updated successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
};

// Add this function to get all roles
export const getAllRoles = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const roles = await prisma.role.findMany();
    res.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ message: "Failed to fetch roles" });
  }
};

// You can add other user-related controller functions here later, e.g.:
// export const updateUserProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => { ... };
