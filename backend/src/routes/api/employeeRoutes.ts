import express from "express";
import * as employeesController from "../../controllers/employeeController";
import { authenticateToken } from "../../middleware/auth";
import { authorize } from "../../middleware/authorize"; // Use the new factory

const router = express.Router();

// --- Admin-only routes for managing employees ---
router.get(
  "/",
  authenticateToken,
  authorize(["admin", "receptionist"]),
  employeesController.getAllEmployees
);

router.post(
  "/admin",
  authenticateToken,
  authorize(["admin"]),
  employeesController.createAdmin
);

router.post(
  "/receptionist",
  authenticateToken,
  authorize(["admin"]),
  employeesController.createReceptionist
);

// Route for an employee to get their own data
router.get(
  "/current",
  authenticateToken,
  authorize(["admin", "doctor", "receptionist"]),
  employeesController.getCurrentEmployee
);

router.get(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  employeesController.getEmployeeById
);

router.patch(
  "/:id/deactivate",
  authenticateToken,
  authorize(["admin"]),
  employeesController.deactivateEmployee
);

router.put(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  employeesController.updateEmployee
);

router.patch(
  "/:id/reactivate",
  authenticateToken,
  authorize(["admin"]),
  employeesController.reactivateEmployee
);

export default router;
