import express from "express";
import * as patientController from "../../controllers/patientController";
import { authenticateToken } from "../../middleware/auth";
import { authorizeAdmin } from "../../middleware/authorize";

const router = express.Router();

// Create a new patient - accessible to admins
router.post(
  "/",
  authenticateToken,
  authorizeAdmin,
  patientController.createPatient
);

// Get all patients - accessible to admins
router.get(
  "/",
  authenticateToken,
  authorizeAdmin,
  patientController.getAllPatients
);

// Get patient by ID - accessible to admins
router.get(
  "/:id",
  authenticateToken,
  authorizeAdmin,
  patientController.getPatientById
);

// Deactivate a patient - accessible to admins
router.patch(
  "/:id/deactivate",
  authenticateToken,
  authorizeAdmin,
  patientController.deactivatePatient
);

// Reactivate a patient - accessible to admins
router.patch(
  "/:id/reactivate",
  authenticateToken,
  authorizeAdmin,
  patientController.reactivatePatient
);

// Update a patient - accessible to admins
router.put(
  "/:id",
  authenticateToken,
  authorizeAdmin,
  patientController.updatePatient
);

export default router;
