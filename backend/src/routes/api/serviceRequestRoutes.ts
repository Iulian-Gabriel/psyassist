import express from "express";
import * as serviceRequestController from "../../controllers/serviceRequestController";
import { authenticateToken } from "../../middleware/auth";

const router = express.Router();

// Get all service requests
router.get(
  "/",
  authenticateToken,
  serviceRequestController.getAllServiceRequests
);

// Get service request by ID
router.get(
  "/:id",
  authenticateToken,
  serviceRequestController.getServiceRequestById
);

// Create a new service request
router.post(
  "/",
  authenticateToken,
  serviceRequestController.createServiceRequest
);

// Approve a service request
router.patch(
  "/:id/approve",
  authenticateToken,
  serviceRequestController.approveServiceRequest
);

// Reject a service request
router.patch(
  "/:id/reject",
  authenticateToken,
  serviceRequestController.rejectServiceRequest
);

// Mark a service request as scheduled
router.patch(
  "/:id/scheduled",
  authenticateToken,
  serviceRequestController.markServiceRequestScheduled
);

// Get service requests for a specific patient
router.get(
  "/patient/:patientId",
  authenticateToken,
  serviceRequestController.getPatientServiceRequests
);

export default router;
