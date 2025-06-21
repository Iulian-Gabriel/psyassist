import express from "express";
import * as employeesController from "../../controllers/employeeController";
import { authenticateToken } from "../../middleware/auth";
import { authorizeAdmin } from "../../middleware/authorize";

const router = express.Router();

// Routes that require admin privilege
router.get(
  "/",
  authenticateToken,
  authorizeAdmin,
  employeesController.getAllEmployees
);
router.post(
  "/admin",
  authenticateToken,
  authorizeAdmin,
  employeesController.createAdmin
);
router.post(
  "/receptionist",
  authenticateToken,
  authorizeAdmin,
  employeesController.createReceptionist
);

router.get(
  "/current",
  authenticateToken,
  employeesController.getCurrentEmployee
);

router.get(
  "/:id",
  authenticateToken,
  authorizeAdmin,
  employeesController.getEmployeeById
);
router.patch(
  "/:id/deactivate",
  authenticateToken,
  authorizeAdmin,
  employeesController.deactivateEmployee
);
// Add this to your employee routes
router.put(
  "/:id",
  authenticateToken,
  authorizeAdmin,
  employeesController.updateEmployee
);
// Add reactivate route
router.patch(
  "/:id/reactivate",
  authenticateToken,
  authorizeAdmin,
  employeesController.reactivateEmployee
);
// Add this to your employeeRoutes.ts

export default router;
