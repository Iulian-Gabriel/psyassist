import express from "express";
import * as feedbackController from "../../controllers/feedbackController";
import { authenticateToken } from "../../middleware/auth";

const router = express.Router();

// Get all feedback (for admin)
router.get("/", authenticateToken, feedbackController.getAllFeedback);

// Get services available for providing feedback (for patients)
router.get(
  "/services",
  authenticateToken,
  feedbackController.getServicesForFeedback
);

// Get feedback for a specific doctor
router.get(
  "/doctor/:id",
  authenticateToken,
  feedbackController.getDoctorFeedback
);

// Get all clinic/service feedback
router.get("/clinic", authenticateToken, feedbackController.getClinicFeedback);

// Get all feedback for a doctor (both personal and clinic)
router.get(
  "/doctor/:id/all",
  authenticateToken,
  feedbackController.getDoctorAllFeedback
);

// Get specific feedback by ID
router.get("/:id", authenticateToken, feedbackController.getFeedbackById);

// Create new feedback
router.post("/", authenticateToken, feedbackController.createFeedback);

// Update feedback
router.put("/:id", authenticateToken, feedbackController.updateFeedback);

// Delete feedback
router.delete("/:id", authenticateToken, feedbackController.deleteFeedback);

// Route for general clinic feedback (without service selection)
router.post(
  "/general-clinic",
  authenticateToken,
  feedbackController.createGeneralClinicFeedback
);

export default router;
