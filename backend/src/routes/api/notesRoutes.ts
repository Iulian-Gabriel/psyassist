import express from "express";
import * as notesController from "../../controllers/notesController";
import { authenticateToken } from "../../middleware/auth";

const router = express.Router();

// Get all services for creating notes
router.get("/services", authenticateToken, notesController.getServicesForNotes);

// Get all patients for creating notes
router.get("/patients", authenticateToken, notesController.getPatientsForNotes);

// Get all notes for a specific patient
router.get(
  "/patient/:patientId",
  authenticateToken,
  notesController.getPatientNotes
);

// Get all notes for a doctor's patients
router.get(
  "/doctor/:doctorId",
  authenticateToken,
  notesController.getDoctorPatientNotes
);

// Get a specific note
router.get("/:id", authenticateToken, notesController.getNoteById);

// Create a new note
router.post("/", authenticateToken, notesController.createNote);

// Update a note
router.put("/:id", authenticateToken, notesController.updateNote);

// Delete a note
router.delete("/:id", authenticateToken, notesController.deleteNote);

export default router;
