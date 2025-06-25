import express from "express";
import * as patientController from "../../controllers/patientController";
import { authenticateToken } from "../../middleware/auth";
import { authorize } from "../../middleware/authorize";

const router = express.Router();

// Create a new patient - accessible to admins and receptionists
router.post(
  "/",
  authenticateToken,
  authorize(["admin", "receptionist"]), // CHANGED
  patientController.createPatient
);

// Get all patients - accessible to admins and receptionists
router.get(
  "/",
  authenticateToken,
  authorize(["admin", "receptionist"]), // CHANGED
  patientController.getAllPatients
);

// Get patient by ID - Admin and Receptionist can view details
router.get(
  "/:id",
  authenticateToken,
  authorize(["admin", "receptionist"]), // CHANGED
  patientController.getPatientById
);

// Deactivate/Reactivate/Update a patient - Admin only for these sensitive actions
router.patch(
  "/:id/deactivate",
  authenticateToken,
  authorize(["admin"]), // CHANGED
  patientController.deactivatePatient
);

router.patch(
  "/:id/reactivate",
  authenticateToken,
  authorize(["admin"]), // CHANGED
  patientController.reactivatePatient
);

router.put(
  "/:id",
  authenticateToken,
  authorize(["admin"]), // CHANGED
  patientController.updatePatient
);

export default router;
