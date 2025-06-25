import express from "express";
import { authenticateToken } from "../../middleware/auth";
import { authorize } from "../../middleware/authorize";
import * as receptionistController from "../../controllers/receptionistController";

const router = express.Router();

// Routes for receptionist to access their own data
router.get(
  "/current",
  authenticateToken,
  authorize(["receptionist"]),
  receptionistController.getCurrentReceptionist
);

// Routes that require admin privilege
router.get(
  "/",
  authenticateToken,
  authorize(["admin"]),
  receptionistController.getAllReceptionists
);

router.post(
  "/",
  authenticateToken,
  authorize(["admin"]),
  receptionistController.createReceptionist
);

router.get(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  receptionistController.getReceptionistById
);

router.patch(
  "/:id/deactivate",
  authenticateToken,
  authorize(["admin"]),
  receptionistController.deactivateReceptionist
);

router.patch(
  "/:id/reactivate",
  authenticateToken,
  authorize(["admin"]),
  receptionistController.reactivateReceptionist
);

router.put(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  receptionistController.updateReceptionist
);

export default router;
