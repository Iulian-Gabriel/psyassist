// src/routes/api/userRoutes.ts

import express from "express";
// No longer need Request, Response directly here
import { authenticateToken } from "../../middleware/auth";
import { authorize } from "../../middleware/authorize"; // Changed from authorizeAdmin
// Import the user controller
import * as userController from "../../controllers/userController";

const router = express.Router();

// User routes
router.get("/profile/:id", authenticateToken, userController.getUserProfile);

// Admin-only route for fetching all users
router.get(
  "/",
  authenticateToken,
  authorize(["admin"]),
  userController.getAllUsers
);

// Add this route to userRoutes.ts
router.patch(
  "/:id/deactivate",
  authenticateToken,
  authorize(["admin"]),
  userController.deactivateUser
);

// Add reactivate route
router.patch(
  "/:id/reactivate",
  authenticateToken,
  authorize(["admin"]),
  userController.reactivateUser
);

// Add this route - Allow both admin and receptionist to fetch roles
router.get(
  "/roles",
  authenticateToken,
  authorize(["admin", "receptionist"]),
  userController.getAllRoles
);

// Add these routes
router.get(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  userController.getUserById
);
router.put(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  userController.updateUser
);

export default router;
