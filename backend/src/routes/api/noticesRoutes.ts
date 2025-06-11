import express from "express";
import * as noticesController from "../../controllers/noticesController";
import { authenticateToken } from "../../middleware/auth";

const router = express.Router();

// --- Static GET routes first ---

// Get all notices
router.get("/", authenticateToken, noticesController.getAllNotices);

// Generate unique notice number
router.get(
  "/generate-number",
  authenticateToken,
  noticesController.generateNoticeNumber
);

// Get services for creating notices
router.get(
  "/services/list",
  authenticateToken,
  noticesController.getServicesForNotices
);

// Get patients for creating notices
router.get(
  "/patients/list",
  authenticateToken,
  noticesController.getPatientsForNotices
);

// --- Dynamic GET routes last ---

// Get notices for a specific patient (more specific dynamic route)
router.get(
  "/patient/:patientId",
  authenticateToken,
  noticesController.getPatientNotices
);

// Get notice by ID (most general dynamic route)
router.get("/:id", authenticateToken, noticesController.getNoticeById);

// --- Other Methods (POST, PUT, DELETE) ---

// Create a new notice
router.post("/", authenticateToken, noticesController.createNotice);

// Update a notice
router.put("/:id", authenticateToken, noticesController.updateNotice);

// Delete a notice
router.delete("/:id", authenticateToken, noticesController.deleteNotice);

export default router;
