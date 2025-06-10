import express from "express";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import patientRoutes from "./patientRoutes";
import employeeRoutes from "./employeeRoutes";
import formsRoutes from "./formsRoutes";
import adminRoutes from "./adminRoutes";
import serviceRoutes from "./serviceRoutes";
import testsRoutes from "./testsRoutes";
import notesRoutes from "./notesRoutes"; // Add this line

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
router.use("/notes", notesRoutes); // Add this line

export default router;
