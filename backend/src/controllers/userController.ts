// src/controllers/userController.ts

import { Request, Response } from "express";
import * as userService from "../services/userService";
import { User } from "@prisma/client"; // Optional: For stronger typing if needed
import prisma from "../utils/prisma"; // Add this import
import bcrypt from "bcrypt";
import { z } from "zod";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    roles: string[];
  };
}

//Gets the profile information for the authenticated user.

export const getUserProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const requestedUserId = parseInt(req.params.id, 10); // Get ID from URL parameter
    const authenticatedUserId = req.user?.userId; // Get ID from auth token
    const authenticatedUserRoles = req.user?.roles || [];

    if (isNaN(requestedUserId)) {
      res.status(400).json({ message: "Invalid user ID format." });
      return;
    }

    if (!authenticatedUserId) {
      console.error("Error: userId missing from request after authentication.");
      // Should ideally be caught by middleware, but good to check
      res.status(401).json({ message: "Authentication error" });
      return;
    }

    // Authorization Check: Allow access if IDs match OR if the user is an admin
    if (
      authenticatedUserId !== requestedUserId &&
      !authenticatedUserRoles.includes("admin")
    ) {
      res.status(403).json({
        message: "Forbidden: You are not authorized to view this profile.",
      });
      return; // Stop execution if not authorized
    }

    // Fetch the user using the ID from the URL parameter
    const user = await userService.findById(String(requestedUserId));

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

// Validation schema for updating a user profile
const updateUserProfileSchema = z.object({
  first_name: z.string().min(1, "First name is required").optional(),
  last_name: z.string().min(1, "Last name is required").optional(),
  email: z.string().email("Invalid email format").optional(),
  phone_number: z.string().optional().nullable(),
  address_street: z.string().optional().nullable(),
  address_city: z.string().optional().nullable(),
  address_postal_code: z.string().optional().nullable(),
  address_county: z.string().optional().nullable(),
  address_country: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
});

export const updateUserProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Authentication error" });
      return;
    }

    const validatedData = updateUserProfileSchema.parse(req.body);

    const dataToUpdate: any = { ...validatedData };
    if (validatedData.date_of_birth) {
      dataToUpdate.date_of_birth = new Date(validatedData.date_of_birth);
    }

    // If email is being updated, check if it's already taken by another user
    if (validatedData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          NOT: {
            user_id: userId,
          },
        },
      });
      if (existingUser) {
        res
          .status(409)
          .json({ message: "Email is already in use by another account." });
        return;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { user_id: userId },
      data: dataToUpdate,
    });

    const { password_hash, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ message: "Invalid data provided", details: error.errors });
    } else {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Server error updating profile" });
    }
  }
};

// Validation schema for changing password
const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Old password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Authentication error" });
      return;
    }

    const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(
      oldPassword,
      user.password_hash
    );
    if (!isPasswordValid) {
      res.status(400).json({ message: "Incorrect old password" });
      return;
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { user_id: userId },
      data: { password_hash: newPasswordHash },
    });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ message: "Invalid data provided", details: error.errors });
    } else {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Server error changing password" });
    }
  }
};
