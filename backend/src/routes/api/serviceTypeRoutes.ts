import express from "express";
import * as serviceTypeController from "../../controllers/serviceTypeController";
import { authenticateToken } from "../../middleware/auth";
import { authorizeAdmin } from "../../middleware/authorize";

const router = express.Router();

// Get all active service types (no auth required for public access)
router.get("/", serviceTypeController.getAllServiceTypes);

// Admin-only routes for managing service types
router.post(
  "/",
  authenticateToken,
  authorizeAdmin,
  serviceTypeController.createServiceType
);
router.get("/:id", authenticateToken, serviceTypeController.getServiceTypeById);
router.put(
  "/:id",
  authenticateToken,
  authorizeAdmin,
  serviceTypeController.updateServiceType
);
router.delete(
  "/:id",
  authenticateToken,
  authorizeAdmin,
  serviceTypeController.deleteServiceType
);

export default router;
