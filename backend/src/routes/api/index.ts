import express from "express";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import patientRoutes from "./patientRoutes";
import employeeRoutes from "./employeeRoutes";
import formsRoutes from "./formsRoutes";
import adminRoutes from "./adminRoutes";
import serviceRoutes from "./serviceRoutes";
import testsRoutes from "./testsRoutes";
import notesRoutes from "./notesRoutes";
import noticesRoutes from "./noticesRoutes";
import feedbackRoutes from "./feedbackRoutes";
import serviceRequestRoutes from "./serviceRequestRoutes";
import serviceTypeRoutes from "./serviceTypeRoutes";
import doctorRoutes from "./doctorRoutes";
import receptionistRoutes from "./receptionistRoutes";

const router = express.Router();

// Register routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/patients", patientRoutes);
router.use("/employees", employeeRoutes);
router.use("/forms", formsRoutes);
router.use("/admin", adminRoutes);
router.use("/services", serviceRoutes);
router.use("/tests", testsRoutes);
router.use("/notes", notesRoutes);
router.use("/notices", noticesRoutes);
router.use("/feedback", feedbackRoutes);
router.use("/service-requests", serviceRequestRoutes);
router.use("/service-types", serviceTypeRoutes);
router.use("/doctors", doctorRoutes);
router.use("/receptionists", receptionistRoutes);

export default router;
