import { Request, Response } from "express";
import prisma from "../utils/prisma";
// import { AuthenticatedRequest } from "../types/auth"; // If you have this type

// Get all feedback
export const getAllFeedback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const feedback = await prisma.feedback.findMany({
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
      orderBy: {
        submission_date: "desc",
      },
    });

    res.json(feedback);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({ message: "Failed to fetch feedback" });
  }
};

// Get feedback by ID
export const getFeedbackById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const feedbackId = parseInt(req.params.id, 10);
    if (isNaN(feedbackId)) {
      res.status(400).json({ message: "Invalid feedback ID" });
      return;
    }

    const feedback = await prisma.feedback.findUnique({
      where: { feedback_id: feedbackId },
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

    if (!feedback) {
      res.status(404).json({ message: "Feedback not found" });
      return;
    }

    res.json(feedback);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({ message: "Failed to fetch feedback" });
  }
};

// Get all feedback for a specific doctor
export const getDoctorFeedback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const doctorId = parseInt(req.params.id, 10);
    if (isNaN(doctorId)) {
      res.status(400).json({ message: "Invalid doctor ID" });
      return;
    }

    // Updated query to explicitly filter by target_type
    const feedback = await prisma.feedback.findMany({
      where: {
        // The feedback must be explicitly for a DOCTOR
        target_type: "DOCTOR",
        // And it must be for a service performed by that doctor
        service: {
          doctor: {
            doctor_id: doctorId,
          },
        },
      },
      include: {
        service: {
          include: {
            doctor: {
              include: {
                employee: {
                  include: {
                    user: {
                      select: {
                        first_name: true,
                        last_name: true,
                      },
                    },
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
                user: {
                  select: {
                    first_name: true,
                    last_name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        submission_date: "desc",
      },
    });

    res.json(feedback);
  } catch (error) {
    console.error("Error fetching doctor feedback:", error);
    res.status(500).json({ message: "Failed to fetch doctor feedback" });
  }
};

// Create new feedback
export const createFeedback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      service_id,
      participant_id,
      rating_score,
      comments,
      is_anonymous,
      feedback_target, // This comes from frontend as "doctor" or "clinic"
    } = req.body;

    // Validate required fields
    if (!service_id || !participant_id || !feedback_target) {
      res.status(400).json({
        message: "Service ID, Participant ID, and feedback target are required",
      });
      return;
    }

    // Map frontend value to the enum value expected by Prisma schema
    const target_type =
      feedback_target.toUpperCase() === "CLINIC" ? "SERVICE" : "DOCTOR";

    // Create the feedback
    const feedback = await prisma.feedback.create({
      data: {
        service_id: parseInt(service_id),
        participant_id: parseInt(participant_id),
        rating_score: rating_score ? parseInt(rating_score) : null,
        comments,
        is_anonymous: is_anonymous === true,
        submission_date: new Date(),
        target_type: target_type, // Use the enum value directly
      },
      include: {
        service: true,
        serviceParticipant: true,
      },
    });

    res.status(201).json(feedback);
  } catch (error) {
    console.error("Error creating feedback:", error);
    res.status(500).json({ message: "Failed to create feedback" });
  }
};

// Update feedback
export const updateFeedback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const feedbackId = parseInt(req.params.id, 10);
    if (isNaN(feedbackId)) {
      res.status(400).json({ message: "Invalid feedback ID" });
      return;
    }

    const { rating_score, comments, is_anonymous } = req.body;

    // Check if feedback exists
    const existingFeedback = await prisma.feedback.findUnique({
      where: { feedback_id: feedbackId },
    });

    if (!existingFeedback) {
      res.status(404).json({ message: "Feedback not found" });
      return;
    }

    // Update the feedback
    const updatedFeedback = await prisma.feedback.update({
      where: { feedback_id: feedbackId },
      data: {
        rating_score: rating_score ? parseInt(rating_score) : null,
        comments,
        is_anonymous: is_anonymous === true,
      },
    });

    res.json(updatedFeedback);
  } catch (error) {
    console.error("Error updating feedback:", error);
    res.status(500).json({ message: "Failed to update feedback" });
  }
};

// Delete feedback
export const deleteFeedback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const feedbackId = parseInt(req.params.id, 10);
    if (isNaN(feedbackId)) {
      res.status(400).json({ message: "Invalid feedback ID" });
      return;
    }

    // Check if feedback exists
    const existingFeedback = await prisma.feedback.findUnique({
      where: { feedback_id: feedbackId },
    });

    if (!existingFeedback) {
      res.status(404).json({ message: "Feedback not found" });
      return;
    }

    // Delete the feedback
    await prisma.feedback.delete({
      where: { feedback_id: feedbackId },
    });

    res.json({ message: "Feedback deleted successfully" });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({ message: "Failed to delete feedback" });
  }
};

// Get services for providing feedback (for patients)
export const getServicesForFeedback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get the patient ID from the query parameters
    const patientId = parseInt(req.query.patientId as string, 10);

    if (isNaN(patientId)) {
      res.status(400).json({ message: "Invalid patient ID" });
      return;
    }

    // Get the services where the patient was a participant and feedback hasn't been submitted yet
    const services = await prisma.service.findMany({
      where: {
        serviceParticipants: {
          some: {
            patient_id: patientId,
            // Only include services that are completed
            service: {
              status: "Completed",
            },
          },
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
          where: {
            patient_id: patientId,
          },
          include: {
            patient: true,
            // Include feedback to check if it exists
            feedbacks: true,
          },
        },
      },
    });

    // Filter out services that already have feedback
    const servicesWithoutFeedback = services.filter((service) =>
      service.serviceParticipants.every(
        (participant) => participant.feedbacks.length === 0
      )
    );

    res.json(servicesWithoutFeedback);
  } catch (error) {
    console.error("Error fetching services for feedback:", error);
    res.status(500).json({ message: "Failed to fetch services for feedback" });
  }
};

// Add a new function to get clinic/service feedback
export const getClinicFeedback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get all "general service" feedback
    const clinicFeedback = await prisma.feedback.findMany({
      where: {
        target_type: "SERVICE",
      },
      include: {
        service: {
          include: {
            doctor: {
              include: {
                employee: {
                  include: {
                    user: {
                      select: {
                        first_name: true,
                        last_name: true,
                      },
                    },
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
                user: {
                  select: {
                    first_name: true,
                    last_name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        submission_date: "desc",
      },
    });

    res.json(clinicFeedback);
  } catch (error) {
    console.error("Error fetching clinic feedback:", error);
    res.status(500).json({ message: "Failed to fetch clinic feedback" });
  }
};

// Add a combined function to get all feedback for a specific doctor, including both personal and clinic feedback for their services
export const getDoctorAllFeedback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const doctorId = parseInt(req.params.id, 10);
    if (isNaN(doctorId)) {
      res.status(400).json({ message: "Invalid doctor ID" });
      return;
    }

    // Get all feedback related to this doctor's services
    const feedback = await prisma.feedback.findMany({
      where: {
        service: {
          doctor: {
            doctor_id: doctorId,
          },
        },
      },
      include: {
        service: {
          include: {
            doctor: {
              include: {
                employee: {
                  include: {
                    user: {
                      select: {
                        first_name: true,
                        last_name: true,
                      },
                    },
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
                user: {
                  select: {
                    first_name: true,
                    last_name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        submission_date: "desc",
      },
    });

    // Categorize the feedback
    const categorizedFeedback = {
      all: feedback,
      doctorSpecific: feedback.filter((item) => item.target_type === "DOCTOR"),
      clinicFeedback: feedback.filter((item) => item.target_type === "SERVICE"),
    };

    res.json(categorizedFeedback);
  } catch (error) {
    console.error("Error fetching doctor's feedback:", error);
    res.status(500).json({ message: "Failed to fetch feedback" });
  }
};
