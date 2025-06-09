import express from "express";
import * as testsController from "../../controllers/testsController";
import { authenticateToken } from "../../middleware/auth";
import { authorizeStaff, authorizeAdmin } from "../../middleware/authorize";

const router = express.Router();

// Get all tests for a doctor's patients
router.get(
  "/doctor/:id",
  authenticateToken,
  authorizeStaff,
  testsController.getDoctorPatientTests
);

// Get specific test instance details
router.get(
  "/:id",
  authenticateToken,
  authorizeStaff,
  testsController.getTestInstance
);

// Assign a test to a patient
router.post(
  "/assign",
  authenticateToken, // Only authentication, no role check for now
  testsController.assignTestToPatient
);

// Get a patient's tests (for patient portal)
router.get("/patient/:id", authenticateToken, testsController.getPatientTests);

// Update this route to remove role restrictions
router.get(
  "/",
  authenticateToken, // Keep authentication but remove role check
  testsController.getAllTests
);

export default router;
