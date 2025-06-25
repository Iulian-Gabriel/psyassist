import express from "express";
import * as doctorController from "../../controllers/doctorController";
import * as serviceController from "../../controllers/serviceController";
import { authenticateToken } from "../../middleware/auth";
import { authorize } from "../../middleware/authorize";

const router = express.Router();

// Routes for a doctor to access their own data
router.get(
  "/current/patients",
  authenticateToken,
  authorize(["doctor"]),
  doctorController.getDoctorPatients
);

router.get(
  "/current/services",
  authenticateToken,
  authorize(["doctor"]),
  serviceController.getDoctorServices
);

router.get(
  "/current",
  authenticateToken,
  authorize(["doctor"]),
  doctorController.getCurrentDoctor
);

// --- Admin-only routes for managing doctors ---

router.get(
  "/",
  authenticateToken,
  authorize(["admin"]),
  doctorController.getAllDoctors
);

router.post(
  "/",
  authenticateToken,
  authorize(["admin"]),
  doctorController.createDoctor
);

router.get(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  doctorController.getDoctorById
);

router.patch(
  "/:id/deactivate",
  authenticateToken,
  authorize(["admin"]),
  doctorController.deactivateDoctor
);

router.patch(
  "/:id/reactivate",
  authenticateToken,
  authorize(["admin"]),
  doctorController.reactivateDoctor
);

router.put(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  doctorController.updateDoctor
);

export default router;
