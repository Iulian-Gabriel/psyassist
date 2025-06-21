import express from "express";
import * as doctorController from "../../controllers/doctorController";
import { authenticateToken } from "../../middleware/auth";
import { authorizeAdmin, authorizeDoctor } from "../../middleware/authorize";

const router = express.Router();

// Routes that require admin privilege
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

// Routes for doctor to access their own data
router.get(
  "/current",
  authenticateToken,
  authorizeDoctor,
  doctorController.getCurrentDoctor
);

export default router;
