import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";
import * as userService from "../services/userService";
import { AuthenticatedRequest } from "./auth";

// Middleware to check if user has admin role
export const authorizeAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const userWithRoles = await userService.findByIdWithRoles(req.userId);

    if (!userWithRoles || !userWithRoles.roles) {
      res.status(403).json({ message: "User roles not found" });
      return;
    }

    const isAdmin = userWithRoles.roles.some(
      (role) => role.role_name === "admin"
    );

    if (!isAdmin) {
      res.status(403).json({ message: "Access denied: Admin role required" });
      return;
    }

    next();
  } catch (error) {
    console.error("Authorization error:", error);
    res.status(500).json({ message: "Server error during authorization" });
  }
};

// Middleware to check if user has doctor role
export const authorizeDoctor = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const userWithRoles = await userService.findByIdWithRoles(req.userId);

    if (!userWithRoles || !userWithRoles.roles) {
      res.status(403).json({ message: "User roles not found" });
      return;
    }

    const isDoctor = userWithRoles.roles.some(
      (role) => role.role_name === "doctor"
    );

    if (!isDoctor) {
      res.status(403).json({ message: "Access denied: Doctor role required" });
      return;
    }

    next();
  } catch (error) {
    console.error("Authorization error:", error);
    res.status(500).json({ message: "Server error during authorization" });
  }
};

// Middleware to check if user has admin OR doctor role
export const authorizeStaff = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const userWithRoles = await userService.findByIdWithRoles(req.userId);

    if (!userWithRoles || !userWithRoles.roles) {
      res.status(403).json({ message: "User roles not found" });
      return;
    }

    const isStaff = userWithRoles.roles.some(
      (role) => role.role_name === "admin" || role.role_name === "doctor"
    );

    if (!isStaff) {
      res.status(403).json({ message: "Access denied: Staff role required" });
      return;
    }

    next();
  } catch (error) {
    console.error("Authorization error:", error);
    res.status(500).json({ message: "Server error during authorization" });
  }
};

// Middleware to check if user has receptionist role
export const authorizeReceptionist = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    // Convert userId to number if it's a string
    const userIdNumber =
      typeof req.userId === "string" ? parseInt(req.userId, 10) : req.userId;

    // Check if the user has the receptionist role
    const userRoles = await prisma.userRoles.findMany({
      where: { user_id: userIdNumber },
      include: { role: true },
    });

    const isReceptionist = userRoles.some(
      (userRole) => userRole.role.role_name === "receptionist"
    );

    if (!isReceptionist) {
      res
        .status(403)
        .json({ message: "Access denied: requires receptionist role" });
      return;
    }

    next();
  } catch (error) {
    console.error("Error in receptionist authorization middleware:", error);
    res.status(500).json({ message: "Authorization error" });
  }
};
