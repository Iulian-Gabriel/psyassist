import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { AuthenticatedRequest } from "../middleware/auth"; // If you have this type

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
    const doctorUserId = parseInt(req.params.id, 10);

    if (isNaN(doctorUserId)) {
      res.status(400).json({ message: "Invalid doctor ID" });
      return;
    }

    console.log(
      `[getDoctorFeedback] Fetching feedback for doctor user_id: ${doctorUserId}`
    );

    // Get feedback for services conducted by this doctor
    const feedback = await prisma.feedback.findMany({
      where: {
        AND: [
          {
            // Feedback must be linked to a service participant
            serviceParticipant: {
              service: {
                doctor: {
                  employee: {
                    user_id: doctorUserId,
                  },
                },
              },
            },
          },
          {
            // Only get doctor-targeted feedback
            target_type: "DOCTOR",
          },
        ],
      },
      include: {
        serviceParticipant: {
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

    console.log(
      `[getDoctorFeedback] Found ${feedback.length} feedback items for doctor user_id: ${doctorUserId}`
    );

    // Log some debug info
    feedback.forEach((f, index) => {
      console.log(`[getDoctorFeedback] Feedback ${index + 1}:`, {
        feedback_id: f.feedback_id,
        rating: f.rating_score,
        target_type: f.target_type,
        doctor_name:
          f.serviceParticipant?.service?.doctor?.employee?.user?.first_name +
          " " +
          f.serviceParticipant?.service?.doctor?.employee?.user?.last_name,
        patient_name:
          f.serviceParticipant?.patient?.user?.first_name +
          " " +
          f.serviceParticipant?.patient?.user?.last_name,
      });
    });

    res.json(feedback);
  } catch (error) {
    console.error("Error fetching doctor feedback:", error);
    res.status(500).json({ message: "Failed to fetch feedback" });
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
    const userIdOrPatientId = parseInt(req.query.patientId as string, 10);

    if (isNaN(userIdOrPatientId)) {
      res.status(400).json({ message: "Invalid patient ID" });
      return;
    }

    // First, try to find the patient by patient_id, if not found, try by user_id
    let patient = await prisma.patient.findUnique({
      where: { patient_id: userIdOrPatientId },
    });

    if (!patient) {
      patient = await prisma.patient.findUnique({
        where: { user_id: userIdOrPatientId },
      });
    }

    if (!patient) {
      res.status(404).json({ message: "Patient not found" });
      return;
    }

    const patientId = patient.patient_id;

    // Get the services where the patient was a participant and feedback hasn't been submitted yet
    const services = await prisma.service.findMany({
      where: {
        // First filter: only completed services
        status: "Completed",
        // Second filter: patient must be a participant
        serviceParticipants: {
          some: {
            patient_id: patientId,
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
            patient: {
              include: {
                user: {
                  // Add this to include user data
                  select: {
                    user_id: true,
                    first_name: true,
                    last_name: true,
                  },
                },
              },
            },
            // Include feedback to check if it exists
            feedbacks: true,
          },
        },
      },
      orderBy: {
        start_time: "desc",
      },
    });

    // Filter out services that already have feedback
    const servicesWithoutFeedback = services.filter((service) =>
      service.serviceParticipants.every(
        (participant) => participant.feedbacks.length === 0
      )
    );

    console.log(
      `[getServicesForFeedback] Found ${services.length} completed services, ${servicesWithoutFeedback.length} without feedback`
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

// Add this function to get doctor's average rating
export const getDoctorAverageRating = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    // Find the doctor record for the authenticated user
    const doctor = await prisma.doctor.findFirst({
      where: {
        employee: {
          user_id: userId,
        },
      },
    });

    if (!doctor) {
      res.status(404).json({ message: "Doctor profile not found" });
      return;
    }

    // Get all feedback for this doctor's services
    const feedback = await prisma.feedback.findMany({
      where: {
        AND: [
          {
            serviceParticipant: {
              service: {
                doctor: {
                  doctor_id: doctor.doctor_id,
                },
              },
            },
          },
          {
            target_type: "DOCTOR",
          },
          {
            rating_score: {
              not: null,
            },
          },
        ],
      },
      select: {
        rating_score: true,
      },
    });

    if (feedback.length === 0) {
      res.json({ averageRating: 0, totalRatings: 0 });
      return;
    }

    const totalScore = feedback.reduce(
      (sum, f) => sum + (f.rating_score || 0),
      0
    );
    const averageRating = totalScore / feedback.length;

    res.json({
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      totalRatings: feedback.length,
    });
  } catch (error) {
    console.error("Error calculating doctor average rating:", error);
    res.status(500).json({ message: "Failed to calculate average rating" });
  }
};
