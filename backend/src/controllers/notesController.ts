import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { AuthenticatedRequest } from "../middleware/auth";

// Get all notes for a specific patient
export const getPatientNotes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const patientId = parseInt(req.params.patientId);

    if (isNaN(patientId)) {
      res.status(400).json({ message: "Invalid patient ID" });
      return;
    }

    const notes = await prisma.notes.findMany({
      where: {
        patient_id: patientId,
      },
      include: {
        doctor: {
          include: {
            employee: {
              include: {
                user: true,
              },
            },
          },
        },
        patient: {
          include: {
            user: true,
          },
        },
        service: true,
        serviceParticipant: {
          include: {
            patient: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    res.json(notes);
  } catch (error) {
    console.error("Error fetching patient notes:", error);
    res.status(500).json({ message: "Failed to fetch notes" });
  }
};

// Get a specific note by ID
export const getNoteById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const noteId = parseInt(req.params.id);

    if (isNaN(noteId)) {
      res.status(400).json({ message: "Invalid note ID" });
      return;
    }

    const note = await prisma.notes.findUnique({
      where: { note_id: noteId },
      include: {
        service: {
          include: {
            doctor: {
              include: {
                employee: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
        serviceParticipant: {
          include: {
            patient: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!note) {
      res.status(404).json({ message: "Note not found" });
      return;
    }

    res.json(note);
  } catch (error) {
    console.error("Error fetching note:", error);
    res.status(500).json({ message: "Failed to fetch note" });
  }
};

// Create a new note - Modified to allow notes without a specific service
export const createNote = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { serviceId, patientId, content } = req.body;
    const loggedInUserId = req.user?.userId;

    // Validate required fields
    if (!patientId || !content || !loggedInUserId) {
      res.status(400).json({
        message: "Patient ID, content, and user authentication are required",
      });
      return;
    }

    // Find the doctor associated with the logged-in user
    const doctor = await prisma.doctor.findFirst({
      where: { employee: { user_id: loggedInUserId } },
    });

    if (!doctor) {
      res.status(403).json({ message: "Authenticated user is not a doctor" });
      return;
    }

    // Convert IDs to numbers
    const patientIdNum = parseInt(patientId);
    if (isNaN(patientIdNum)) {
      res.status(400).json({ message: "Invalid patient ID" });
      return;
    }

    const data: any = {
      content,
      patient_id: patientIdNum,
      doctor_id: doctor.doctor_id,
    };

    // If a service is provided, find the participant and link them
    if (serviceId) {
      const serviceIdNum = parseInt(serviceId);
      if (isNaN(serviceIdNum)) {
        res.status(400).json({ message: "Invalid service ID" });
        return;
      }

      const participant = await prisma.serviceParticipant.findFirst({
        where: {
          service_id: serviceIdNum,
          patient_id: patientIdNum,
        },
      });

      if (participant) {
        data.service_id = serviceIdNum;
        data.participant_id = participant.participant_id;
      } else {
        // Optionally handle cases where the patient isn't in the specified service
        console.warn(
          `Patient ${patientIdNum} is not a participant in service ${serviceIdNum}. Note will be created without service link.`
        );
      }
    }

    // Create the note
    const note = await prisma.notes.create({
      data,
      include: {
        doctor: {
          include: {
            employee: {
              include: {
                user: true,
              },
            },
          },
        },
        patient: {
          include: {
            user: true,
          },
        },
        service: true,
        serviceParticipant: {
          include: {
            patient: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(note);
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ message: "Failed to create note" });
  }
};

// Update a note
export const updateNote = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const noteId = parseInt(req.params.id);
    const { content } = req.body;

    if (isNaN(noteId)) {
      res.status(400).json({ message: "Invalid note ID" });
      return;
    }

    if (!content) {
      res.status(400).json({ message: "Content is required" });
      return;
    }

    // Check if note exists
    const existingNote = await prisma.notes.findUnique({
      where: { note_id: noteId },
    });

    if (!existingNote) {
      res.status(404).json({ message: "Note not found" });
      return;
    }

    // Update the note
    const updatedNote = await prisma.notes.update({
      where: { note_id: noteId },
      data: {
        content,
        updated_at: new Date(),
      },
      include: {
        service: true,
        serviceParticipant: {
          include: {
            patient: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    res.json(updatedNote);
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({ message: "Failed to update note" });
  }
};

// Delete a note
export const deleteNote = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const noteId = parseInt(req.params.id);

    if (isNaN(noteId)) {
      res.status(400).json({ message: "Invalid note ID" });
      return;
    }

    // Check if note exists
    const existingNote = await prisma.notes.findUnique({
      where: { note_id: noteId },
    });

    if (!existingNote) {
      res.status(404).json({ message: "Note not found" });
      return;
    }

    // Delete the note
    await prisma.notes.delete({
      where: { note_id: noteId },
    });

    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ message: "Failed to delete note" });
  }
};

// Get all notes for a doctor's patients
// Replace the old function with this corrected version
export const getDoctorPatientNotes = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // This is the user_id of the logged-in doctor
    const loggedInUserId = req.user?.userId;
    if (!loggedInUserId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    // Find the doctor record associated with the user ID
    const doctor = await prisma.doctor.findFirst({
      where: { employee: { user_id: loggedInUserId } },
    });

    // If the user is not a doctor, return an empty array
    if (!doctor) {
      res.json([]);
      return;
    }

    // Now, fetch all notes created by this specific doctor
    const notes = await prisma.notes.findMany({
      where: {
        doctor_id: doctor.doctor_id,
      },
      include: {
        doctor: {
          include: {
            employee: {
              include: {
                user: true,
              },
            },
          },
        },
        patient: {
          include: {
            user: true,
          },
        },
        service: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    res.json(notes);
  } catch (error) {
    console.error("Error fetching doctor's patient notes:", error);
    res.status(500).json({ message: "Failed to fetch notes" });
  }
};

// Get all services for creating notes - Modified to include services with patient information
export const getServicesForNotes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const services = await prisma.service.findMany({
      where: {
        // Only consider completed and scheduled services (not cancelled ones)
        status: {
          in: ["Completed", "Scheduled"],
        },
      },
      include: {
        doctor: {
          include: {
            employee: {
              include: {
                user: true,
              },
            },
          },
        },
        serviceParticipants: {
          include: {
            patient: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: {
        start_time: "desc",
      },
    });

    // Filter out services without patient participants
    const servicesWithPatients = services.filter(
      (service) =>
        service.serviceParticipants && service.serviceParticipants.length > 0
    );

    res.json(servicesWithPatients);
  } catch (error) {
    console.error("Error fetching services for notes:", error);
    res.status(500).json({ message: "Failed to fetch services" });
  }
};

// Get all patients available for notes
export const getPatientsForNotes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const patients = await prisma.patient.findMany({
      where: {
        user: {
          is_active: true,
        },
      },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy: {
        user: {
          last_name: "asc",
        },
      },
    });

    res.json(patients);
  } catch (error) {
    console.error("Error fetching patients for notes:", error);
    res.status(500).json({ message: "Failed to fetch patients" });
  }
};
