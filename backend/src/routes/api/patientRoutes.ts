import express from "express";
import * as patientController from "../../controllers/patientController";
import { authenticateToken } from "../../middleware/auth";
import { authorize } from "../../middleware/authorize";

const router = express.Router();

// Get patient assessment results - accessible to doctors
router.get(
  "/:id/assessment-results",
  authenticateToken,
  authorize(["doctor", "admin"]),
  patientController.getPatientAssessmentResults
);

// Cancel patient's appointment
router.patch(
  "/appointments/:serviceId/cancel",
  authenticateToken,
  authorize(["patient"]),
  patientController.cancelPatientAppointment
);

// Get patient's own appointments history
router.get(
  "/appointments/history",
  authenticateToken,
  authorize(["patient"]),
  patientController.getPatientAppointmentsHistory
);

// Get patient's upcoming appointments
router.get(
  "/appointments/upcoming",
  authenticateToken,
  authorize(["patient"]),
  patientController.getPatientUpcomingAppointments
);

// Create a new patient - accessible to admins and receptionists
router.post(
  "/",
  authenticateToken,
  authorize(["admin", "receptionist"]),
  patientController.createPatient
);

// Get all patients - accessible to admins and receptionists
router.get(
  "/",
  authenticateToken,
  authorize(["admin", "receptionist"]),
  patientController.getAllPatients
);

// Get patient by ID - Admin and Receptionist can view details
router.get(
  "/:id",
  authenticateToken,
  authorize(["admin", "receptionist", "doctor"]),
  patientController.getPatientById
);

// Deactivate/Reactivate/Update a patient - Admin only for these sensitive actions
router.patch(
  "/:id/deactivate",
  authenticateToken,
  authorize(["admin"]),
  patientController.deactivatePatient
);

router.patch(
  "/:id/reactivate",
  authenticateToken,
  authorize(["admin"]),
  patientController.reactivatePatient
);

router.put(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  patientController.updatePatient
);

export default router;
