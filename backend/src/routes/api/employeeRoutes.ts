import express from "express";
import * as employeeController from "../../controllers/employeeController";
import { authenticateToken } from "../../middleware/auth";
import { authorizeAdmin } from "../../middleware/authorize";

const router = express.Router();

// Routes that require admin privilege
router.get(
  "/",
  authenticateToken,
  authorizeAdmin,
  employeeController.getAllEmployees
);
router.post(
  "/admin",
  authenticateToken,
  authorizeAdmin,
  employeeController.createAdmin
);
router.post(
  "/doctor",
  authenticateToken,
  authorizeAdmin,
  employeeController.createDoctor
);
router.get(
  "/:id",
  authenticateToken,
  authorizeAdmin,
  employeeController.getEmployeeById
);
router.patch(
  "/:id/deactivate",
  authenticateToken,
  authorizeAdmin,
  employeeController.deactivateEmployee
);
// Add this to your employee routes
router.put(
  "/:id",
  authenticateToken,
  authorizeAdmin,
  employeeController.updateEmployee
);
// Add reactivate route
router.patch(
  "/:id/reactivate",
  authenticateToken,
  authorizeAdmin,
  employeeController.reactivateEmployee
);

export default router;
