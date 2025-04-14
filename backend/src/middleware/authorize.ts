import { Request, Response, NextFunction } from "express";
import * as userService from "../services/userService";

// Extend the Request interface from the auth middleware
interface AuthenticatedRequest extends Request {
  userId?: string;
}

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
