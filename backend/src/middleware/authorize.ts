import { Response, NextFunction } from "express";
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
    // FIX: Changed req.userId to req.user?.userId
    if (!req.user?.userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    // FIX: Changed req.userId to req.user.userId
    const userWithRoles = await userService.findByIdWithRoles(req.user.userId);

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
    // FIX: Changed req.userId to req.user?.userId
    if (!req.user?.userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    // FIX: Changed req.userId to req.user.userId
    const userWithRoles = await userService.findByIdWithRoles(req.user.userId);

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
    // FIX: Changed req.userId to req.user?.userId
    if (!req.user?.userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    // FIX: Changed req.userId to req.user.userId
    const userWithRoles = await userService.findByIdWithRoles(req.user.userId);

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
    // FIX: Changed req.userId to req.user?.userId
    if (!req.user?.userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    // FIX: Changed req.userId to req.user.userId
    const userIdNumber = req.user.userId;

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

/**
 * Middleware Factory to authorize users based on roles.
 * @param allowedRoles - An array of role names that are allowed to access the route.
 * @returns An Express middleware function.
 */
export const authorize = (allowedRoles: string[]) => {
  // This returns a standard Express middleware function
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // <--- THIS IS THE ONLY CHANGE NEEDED
    try {
      // 1. Check if user is authenticated
      if (!req.user?.userId) {
        res.status(401).json({ message: "User not authenticated" });
        return; // Use a plain return to stop execution
      }

      // 2. Get the user and their roles from the database
      const userWithRoles = await userService.findByIdWithRoles(
        req.user.userId
      );

      // 3. Check if the user and their roles exist
      if (!userWithRoles || !userWithRoles.roles) {
        res.status(403).json({ message: "User roles not found" });
        return;
      }

      // 4. THE CORE LOGIC: Check if the user has at least one of the allowed roles
      const isAuthorized = userWithRoles.roles.some((role) =>
        allowedRoles.includes(role.role_name)
      );

      // 5. If they are not authorized, block them
      if (!isAuthorized) {
        res.status(403).json({
          message: `Access denied: Requires one of the following roles: ${allowedRoles.join(
            ", "
          )}`,
        });
        return;
      }

      // 6. If they are authorized, let them proceed
      next();
    } catch (error) {
      console.error("Authorization error:", error);
      res.status(500).json({ message: "Server error during authorization" });
    }
  };
};
