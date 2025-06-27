// routes/noticesRoutes.ts

import express from "express";
import * as noticesController from "../../controllers/noticesController";
import { authenticateToken } from "../../middleware/auth";
import { authorize } from "../../middleware/authorize";

const router = express.Router();

// Get all notices (for Admin/Receptionist)
router.get(
  "/",
  authenticateToken,
  authorize(["admin", "receptionist"]),
  noticesController.getAllNotices
);

// Get notices for the logged-in doctor
router.get(
  "/doctor",
  authenticateToken,
  authorize(["doctor"]),
  noticesController.getDoctorNotices
);

// Get notices for the logged-in patient (NEW ROUTE)
router.get(
  "/patient/my-notices", // More explicit route for current user
  authenticateToken,
  authorize(["patient"]), // Only patients can access their own notices this way
  noticesController.getLoggedInPatientNotices // New controller function
);

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

// Get notices for a specific patient (Doctor/Admin can use this to view ANY patient's notices)
router.get(
  "/patient/:patientId",
  authenticateToken,
  authorize(["doctor", "admin", "receptionist"]), // Ensure only authorized roles can view arbitrary patient notices
  noticesController.getPatientNotices
);

// Get notice by ID
router.get("/:id", authenticateToken, noticesController.getNoticeById);

// Create a new notice
router.post("/", authenticateToken, noticesController.createNotice);

// Update a notice
router.put("/:id", authenticateToken, noticesController.updateNotice);

// Delete a notice
router.delete("/:id", authenticateToken, noticesController.deleteNotice);

export default router;
