import express from "express";
import { authenticateToken } from "../../middleware/auth";
import { authorize } from "../../middleware/authorize";
import * as dashboardController from "../../controllers/dashboardController";

const router = express.Router();

// Get recent activity for dashboard
router.get(
  "/recent-activity",
  authenticateToken,
  authorize(["admin", "receptionist", "doctor"]),
  dashboardController.getRecentActivity
);

// Get recent activity for doctor
router.get(
  "/doctor/recent-activity",
  authenticateToken,
  authorize(["doctor"]),
  dashboardController.getDoctorRecentActivity
);

// Add admin-specific dashboard routes
router.get(
  "/admin/stats",
  authenticateToken,
  authorize(["admin"]),
  dashboardController.getAdminDashboardStats
);

router.get(
  "/admin/user-growth",
  authenticateToken,
  authorize(["admin"]),
  dashboardController.getUserGrowthData
);

router.get(
  "/admin/system-metrics",
  authenticateToken,
  authorize(["admin"]),
  dashboardController.getSystemMetrics
);

export default router;
