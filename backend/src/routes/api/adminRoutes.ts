import express from "express";
import { authenticateToken } from "../../middleware/auth";
import { authorize } from "../../middleware/authorize";
import * as adminController from "../../controllers/adminController";

const router = express.Router();

// Admin dashboard stats
router.get(
  "/stats",
  authenticateToken,
  authorize(["admin"]), // CHANGED
  adminController.getDashboardStats
);

// You can add other admin-specific routes here later
// router.get("/reports", authenticateToken, authorizeAdmin, adminController.getReports);

export default router;
