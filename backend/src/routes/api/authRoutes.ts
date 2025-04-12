import express from "express";
import * as authController from "../../controllers/authController";
import { authLimiter } from "../../middleware/rateLimit";

const router = express.Router();

// Auth routes
router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);

export default router;
