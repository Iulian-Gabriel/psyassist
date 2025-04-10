import express from "express";
import * as authController from "../../controllers/authController";

const router = express.Router();

// Auth routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);

export default router;
