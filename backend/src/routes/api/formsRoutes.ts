import express from "express";
import * as formsController from "../../controllers/formsController";
import { authenticateToken } from "../../middleware/auth";
import { authorizeStaff } from "../../middleware/authorize";

const router = express.Router();

// Get all forms - accessible to staff (doctors and admins)
router.get("/", authenticateToken, authorizeStaff, formsController.getAllForms);

// Create a new form - accessible to staff
router.post("/", authenticateToken, authorizeStaff, formsController.createForm);

// Get individual form details with responses
router.get(
  "/:id/responses",
  authenticateToken,
  authorizeStaff,
  formsController.getFormResponses
);

// Add this route
router.put(
  "/:id",
  authenticateToken,
  authorizeStaff,
  formsController.updateForm
);

router.get(
  "/:id/versions",
  authenticateToken,
  authorizeStaff,
  formsController.getFormVersions
);

export default router;
