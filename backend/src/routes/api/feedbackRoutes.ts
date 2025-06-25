import express from "express";
import * as feedbackController from "../../controllers/feedbackController";
import { authenticateToken } from "../../middleware/auth";
import { authorize } from "../../middleware/authorize"; // Use the new factory

const router = express.Router();

// Get all feedback -> Admin only
router.get(
  "/",
  authenticateToken,
  authorize(["admin"]),
  feedbackController.getAllFeedback
);

// Get services a patient can give feedback on -> Patient only
router.get(
  "/services",
  authenticateToken,
  authorize(["patient"]),
  feedbackController.getServicesForFeedback
);

// Get feedback for a specific doctor -> Doctor themselves or an Admin
router.get(
  "/doctor/:id",
  authenticateToken,
  authorize(["admin", "doctor"]),
  feedbackController.getDoctorFeedback
);

// Get all clinic feedback -> Admin only
router.get(
  "/clinic",
  authenticateToken,
  authorize(["admin"]),
  feedbackController.getClinicFeedback
);

// Get all feedback related to a doctor's services -> Doctor or Admin
router.get(
  "/doctor/:id/all",
  authenticateToken,
  authorize(["admin", "doctor"]),
  feedbackController.getDoctorAllFeedback
);

// Create new feedback -> Patient only
router.post(
  "/",
  authenticateToken,
  authorize(["patient"]),
  feedbackController.createFeedback
);

// Delete feedback -> Admin only
router.delete(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  feedbackController.deleteFeedback
);

// Create general clinic feedback -> Patient only
router.post(
  "/general-clinic",
  authenticateToken,
  authorize(["patient"]),
  feedbackController.createGeneralClinicFeedback
);

// Get a specific feedback item by ID (Admin or involved Doctor)
router.get(
  "/:id",
  authenticateToken,
  authorize(["admin", "doctor"]),
  feedbackController.getFeedbackById
);

// Update feedback -> usually an admin task if moderation is needed
router.put(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  feedbackController.updateFeedback
);

export default router;
