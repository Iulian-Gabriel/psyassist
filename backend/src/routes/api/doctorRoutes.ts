import express from "express";
import * as doctorController from "../../controllers/doctorController";
import * as serviceController from "../../controllers/serviceController";
import { authenticateToken } from "../../middleware/auth";
import { authorizeAdmin, authorizeDoctor } from "../../middleware/authorize";

const router = express.Router();

// --- FIX: Specific routes MUST be defined before general/parameterized routes ---

// Routes for doctor to access their own data
router.get(
  "/current/patients",
  authenticateToken,
  authorizeDoctor,
  doctorController.getDoctorPatients
);

router.get(
  "/current/services", // ADD THIS NEW ROUTE
  authenticateToken,
  authorizeDoctor,
  serviceController.getDoctorServices
);

router.get(
  "/current",
  authenticateToken,
  authorizeDoctor,
  doctorController.getCurrentDoctor
);

// --- Admin-only routes ---

router.get(
  "/",
  authenticateToken,
  authorizeAdmin,
  doctorController.getAllDoctors
);

router.post(
  "/",
  authenticateToken,
  authorizeAdmin,
  doctorController.createDoctor
);

// This general route with a parameter now comes AFTER the specific "/current" routes
router.get(
  "/:id",
  authenticateToken,
  authorizeAdmin,
  doctorController.getDoctorById
);

router.patch(
  "/:id/deactivate",
  authenticateToken,
  authorizeAdmin,
  doctorController.deactivateDoctor
);

router.patch(
  "/:id/reactivate",
  authenticateToken,
  authorizeAdmin,
  doctorController.reactivateDoctor
);

router.put(
  "/:id",
  authenticateToken,
  authorizeAdmin,
  doctorController.updateDoctor
);

export default router;
