import express from "express";
import * as testsController from "../../controllers/testsController";
import { authenticateToken } from "../../middleware/auth";
import { authorizeStaff, authorizeAdmin } from "../../middleware/authorize";
import { authorize } from "../../middleware/authorize";

const router = express.Router();

// Add this route after your existing routes:
router.get(
  "/pending",
  authenticateToken,
  authorize(["doctor"]),
  testsController.getPendingTests
);

router.put(
  "/:id/submit",
  authenticateToken,
  authorize(["patient"]),
  testsController.submitTest
);

// Get a patient's tests (for patient portal)
router.get(
  "/patient/my-tests",
  authenticateToken,
  authorize(["patient"]),
  testsController.getPatientTests
);

// Get all tests for a doctor's patients
router.get(
  "/doctor/:id",
  authenticateToken,
  authorize(["doctor"]),
  testsController.getDoctorPatientTests
);

// Get specific test instance details
router.get(
  "/:id",
  authenticateToken,
  authorize(["doctor", "patient", "admin"]),
  testsController.getTestInstance
);

// Assign a test to a patient
router.post(
  "/assign",
  authenticateToken,
  authorize(["doctor"]),
  testsController.assignTestToPatient
);

// Update this route to remove role restrictions
router.get(
  "/",
  authenticateToken, // Keep authentication but remove role check
  testsController.getAllTests
);

// Get all completed tests for admin view
router.get(
  "/admin/completed",
  authenticateToken,
  authorize(["admin"]),
  testsController.getAllCompletedTests
);

export default router;
