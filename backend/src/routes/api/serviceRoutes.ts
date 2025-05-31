import express from "express";
import * as serviceController from "../../controllers/serviceController";
import { authenticateToken } from "../../middleware/auth";
import { authorizeStaff } from "../../middleware/authorize";

const router = express.Router();

// Get all services
router.get("/", authenticateToken, serviceController.getAllServices);

// Create a new service/appointment
router.post("/", authenticateToken, serviceController.createService);

// Get service by ID
router.get("/:id", authenticateToken, serviceController.getServiceById);

// Cancel a service
router.patch("/:id/cancel", authenticateToken, serviceController.cancelService);

export default router;
