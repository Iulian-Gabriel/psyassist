import express from "express";
import * as receptionistController from "../../controllers/receptionistController";
import { authenticateToken } from "../../middleware/auth";
import {
  authorizeAdmin,
  authorizeReceptionist,
} from "../../middleware/authorize";

const router = express.Router();

// Routes that require admin privilege
router.get(
  "/",
  authenticateToken,
  authorizeAdmin,
  receptionistController.getAllReceptionists
);

router.post(
  "/",
  authenticateToken,
  authorizeAdmin,
  receptionistController.createReceptionist
);

router.get(
  "/:id",
  authenticateToken,
  authorizeAdmin,
  receptionistController.getReceptionistById
);

router.patch(
  "/:id/deactivate",
  authenticateToken,
  authorizeAdmin,
  receptionistController.deactivateReceptionist
);

router.patch(
  "/:id/reactivate",
  authenticateToken,
  authorizeAdmin,
  receptionistController.reactivateReceptionist
);

router.put(
  "/:id",
  authenticateToken,
  authorizeAdmin,
  receptionistController.updateReceptionist
);

// Routes for receptionist to access their own data
router.get(
  "/current",
  authenticateToken,
  authorizeReceptionist,
  receptionistController.getCurrentReceptionist
);

export default router;
