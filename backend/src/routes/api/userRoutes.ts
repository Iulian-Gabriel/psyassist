// src/routes/api/userRoutes.ts

import express from "express";
// No longer need Request, Response directly here
import { authenticateToken } from "../../middleware/auth";
// Import the user controller
import * as userController from "../../controllers/userController";

const router = express.Router();

// User routes
router.get("/profile/:id", authenticateToken, userController.getUserProfile);
export default router;
