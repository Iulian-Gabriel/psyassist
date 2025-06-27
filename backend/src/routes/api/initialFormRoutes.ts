import express from "express";
import * as initialFormController from "../../controllers/initialFormController";
import { authenticateToken } from "../../middleware/auth";
import { authorize } from "../../middleware/authorize";

const router = express.Router();

// Get initial assessment form structure
router.get(
  "/form",
  authenticateToken,
  authorize(["patient"]),
  initialFormController.getInitialAssessmentForm
);

// Submit initial assessment form
router.post(
  "/submit",
  authenticateToken,
  authorize(["patient"]),
  initialFormController.submitInitialAssessment
);

// Get patient's initial assessment results
router.get(
  "/results",
  authenticateToken,
  authorize(["patient"]),
  initialFormController.getPatientInitialAssessment
);

// Check if patient has completed initial assessment
router.get(
  "/status",
  authenticateToken,
  authorize(["patient"]),
  initialFormController.checkInitialAssessmentStatus
);

export default router;
