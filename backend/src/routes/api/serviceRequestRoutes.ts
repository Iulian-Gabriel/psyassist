import express from "express";
import * as serviceRequestController from "../../controllers/serviceRequestController";
import { authenticateToken } from "../../middleware/auth";
import { authorize, authorizeStaff } from "../../middleware/authorize";

const router = express.Router();

// Get all service requests (staff only)
router.get(
  "/",
  authenticateToken,
  authorize(["admin", "doctor", "receptionist"]), // Only admin/doctor can view all requests
  serviceRequestController.getAllServiceRequests
);

// Get service request by ID (staff only)
router.get(
  "/:id",
  authenticateToken,
  authorize(["admin", "doctor"]), // Only admin/doctor can view individual requests
  serviceRequestController.getServiceRequestById
);

// Create a new service request (patients can create their own)
router.post(
  "/",
  authenticateToken,
  authorize(["patient"]), // Only patients can create service requests
  serviceRequestController.createServiceRequest
);

// Approve a service request (staff only)
router.patch(
  "/:id/approve",
  authenticateToken,
  authorize(["admin", "receptionist"]), // Admin or receptionist can approve
  serviceRequestController.approveServiceRequest
);

// Reject a service request (staff only)
router.patch(
  "/:id/reject",
  authenticateToken,
  authorize(["admin", "receptionist"]), // Admin or receptionist can reject
  serviceRequestController.rejectServiceRequest
);

// Mark a service request as scheduled (staff only)
router.patch(
  "/:id/scheduled",
  authenticateToken,
  authorize(["admin", "receptionist"]), // Admin or receptionist can schedule
  serviceRequestController.markServiceRequestScheduled
);

// Get service requests for a specific patient
router.get(
  "/patient/:patientId",
  authenticateToken,
  authorize(["patient", "admin", "doctor", "receptionist"]), // Patient can view their own, staff can view any
  serviceRequestController.getPatientServiceRequests
);

export default router;
