// src/routes/api/userRoutes.ts

import express from "express";
// No longer need Request, Response directly here
import { authenticateToken } from "../../middleware/auth";
import { authorizeAdmin } from "../../middleware/authorize";
// Import the user controller
import * as userController from "../../controllers/userController";

const router = express.Router();

// User routes
router.get("/profile/:id", authenticateToken, userController.getUserProfile);

// Admin-only route for fetching all users
router.get("/", authenticateToken, authorizeAdmin, userController.getAllUsers);

// Add this route to userRoutes.ts
router.patch(
  "/:id/deactivate",
  authenticateToken,
  authorizeAdmin,
  userController.deactivateUser
);

// Add reactivate route
router.patch(
  "/:id/reactivate",
  authenticateToken,
  authorizeAdmin,
  userController.reactivateUser
);

// Add this route
router.get(
  "/roles",
  authenticateToken,
  authorizeAdmin,
  userController.getAllRoles
);

// Add these routes
router.get(
  "/:id",
  authenticateToken,
  authorizeAdmin,
  userController.getUserById
);
router.put(
  "/:id",
  authenticateToken,
  authorizeAdmin,
  userController.updateUser
);

export default router;
