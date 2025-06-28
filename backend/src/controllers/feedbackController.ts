import { Request, Response } from "express";
import prisma from "../utils/prisma";
// import { AuthenticatedRequest } from "../types/auth"; // If you have this type

// Get all feedback
export const getAllFeedback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log(`[getAllFeedback] Starting fetch for all feedback.`);

    const allFeedback = await prisma.feedback.findMany({
      orderBy: { submission_date: "desc" },
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
    });

    console.log(
      `[getAllFeedback] Successfully processed ${allFeedback.length} feedback records`
    );
    res.json(allFeedback);
  } catch (error) {
    console.error("Error fetching all feedback:", error);
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

    const feedback = await prisma.feedback.findMany({
      where: {
        target_type: "DOCTOR",
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
      feedback_target,
      is_clean_facilities,
      is_friendly_staff,
      is_easy_accessibility,
      is_smooth_admin_process,
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

    // Prepare data for Prisma create
    const feedbackData: any = {
      service_id: parseInt(service_id),
      participant_id: parseInt(participant_id),
      rating_score: rating_score ? parseInt(rating_score) : null,
      comments, // This will now only contain general free-text comments
      is_anonymous: is_anonymous === true,
      submission_date: new Date(),
      target_type: target_type,
    };

    // If providing clinic feedback, include only the four specified boolean fields
    if (target_type === "SERVICE") {
      if (typeof is_clean_facilities === "boolean")
        feedbackData.is_clean_facilities = is_clean_facilities;
      if (typeof is_friendly_staff === "boolean")
        feedbackData.is_friendly_staff = is_friendly_staff;
      if (typeof is_easy_accessibility === "boolean")
        feedbackData.is_easy_accessibility = is_easy_accessibility;
      if (typeof is_smooth_admin_process === "boolean")
        feedbackData.is_smooth_admin_process = is_smooth_admin_process;
    }

    // Create the feedback
    const feedback = await prisma.feedback.create({
      data: feedbackData,
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

// Add this new function to your feedbackController.ts

export const createGeneralClinicFeedback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      patient_id,
      rating_score,
      comments,
      is_anonymous,
      is_clean_facilities,
      is_friendly_staff,
      is_easy_accessibility,
      is_smooth_admin_process,
    } = req.body;

    // Validate required fields
    if (!patient_id) {
      res.status(400).json({
        message: "Patient ID is required",
      });
      return;
    }

    const patientId = parseInt(patient_id);
    if (isNaN(patientId)) {
      res.status(400).json({ message: "Invalid patient ID" });
      return;
    }

    // Find the patient to ensure they exist
    const patient = await prisma.patient.findUnique({
      where: { patient_id: patientId },
    });

    if (!patient) {
      res.status(404).json({ message: "Patient not found" });
      return;
    }

    // Create feedback directly without service/participant
    const feedbackData: any = {
      // We're not setting service_id or participant_id
      rating_score: rating_score ? parseInt(rating_score) : null,
      comments: comments, // You could add patient ID info here if needed: `${comments} [Patient ID: ${patientId}]`
      is_anonymous: is_anonymous === true,
      submission_date: new Date(),
      target_type: "SERVICE", // Always SERVICE for general clinic feedback
    };

    // Add clinic-specific boolean fields
    if (typeof is_clean_facilities === "boolean")
      feedbackData.is_clean_facilities = is_clean_facilities;
    if (typeof is_friendly_staff === "boolean")
      feedbackData.is_friendly_staff = is_friendly_staff;
    if (typeof is_easy_accessibility === "boolean")
      feedbackData.is_easy_accessibility = is_easy_accessibility;
    if (typeof is_smooth_admin_process === "boolean")
      feedbackData.is_smooth_admin_process = is_smooth_admin_process;

    // Create the feedback without relations
    const feedback = await prisma.feedback.create({
      data: feedbackData,
    });

    res.status(201).json(feedback);
  } catch (error) {
    console.error("Error creating general clinic feedback:", error);
    res
      .status(500)
      .json({ message: "Failed to create general clinic feedback" });
  }
};
