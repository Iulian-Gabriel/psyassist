import { Request, Response } from "express";
import prisma from "../utils/prisma";
// import { AuthenticatedRequest } from "../types/auth"; // Add this to your types if not already defined

// Get all notices
export const getAllNotices = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const notices = await prisma.notices.findMany({
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
      orderBy: {
        issue_date: "desc",
      },
    });

    res.json(notices);
  } catch (error) {
    console.error("Error fetching notices:", error);
    res.status(500).json({ message: "Failed to fetch notices" });
  }
};

// Get notice by ID
export const getNoticeById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const noticeId = parseInt(req.params.id);
    if (isNaN(noticeId)) {
      res.status(400).json({ message: "Invalid notice ID" });
      return;
    }

    const notice = await prisma.notices.findUnique({
      where: { notice_id: noticeId },
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

    if (!notice) {
      res.status(404).json({ message: "Notice not found" });
      return;
    }

    res.json(notice);
  } catch (error) {
    console.error("Error fetching notice:", error);
    res.status(500).json({ message: "Failed to fetch notice" });
  }
};

// Get notices for a specific patient
export const getPatientNotices = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const patientId = parseInt(req.params.patientId);
    if (isNaN(patientId)) {
      res.status(400).json({ message: "Invalid patient ID" });
      return;
    }

    const notices = await prisma.notices.findMany({
      where: {
        serviceParticipant: {
          patient_id: patientId,
        },
      },
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
        issue_date: "desc",
      },
    });

    res.json(notices);
  } catch (error) {
    console.error("Error fetching patient notices:", error);
    res.status(500).json({ message: "Failed to fetch patient notices" });
  }
};

// Create a new notice
export const createNotice = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      service_id,
      participant_id,
      issue_date,
      unique_notice_number,
      expiry_date,
      reason_for_issuance,
      fitness_status,
      recommendations,
      attachment_path,
    } = req.body;

    // Validate required fields
    if (!service_id || !participant_id) {
      res
        .status(400)
        .json({ message: "Service ID and Participant ID are required" });
      return;
    }

    // Create the notice
    const notice = await prisma.notices.create({
      data: {
        service_id: parseInt(service_id),
        participant_id: parseInt(participant_id),
        issue_date: issue_date ? new Date(issue_date) : new Date(),
        unique_notice_number,
        expiry_date: expiry_date ? new Date(expiry_date) : null,
        reason_for_issuance,
        fitness_status,
        recommendations,
        attachment_path,
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

    res.status(201).json(notice);
  } catch (error) {
    console.error("Error creating notice:", error);
    res.status(500).json({ message: "Failed to create notice" });
  }
};

// Update a notice
export const updateNotice = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const noticeId = parseInt(req.params.id);
    if (isNaN(noticeId)) {
      res.status(400).json({ message: "Invalid notice ID" });
      return;
    }

    const {
      issue_date,
      unique_notice_number,
      expiry_date,
      reason_for_issuance,
      fitness_status,
      recommendations,
      attachment_path,
    } = req.body;

    // Check if notice exists
    const existingNotice = await prisma.notices.findUnique({
      where: { notice_id: noticeId },
    });

    if (!existingNotice) {
      res.status(404).json({ message: "Notice not found" });
      return;
    }

    // Update the notice
    const updatedNotice = await prisma.notices.update({
      where: { notice_id: noticeId },
      data: {
        issue_date: issue_date ? new Date(issue_date) : undefined,
        unique_notice_number,
        expiry_date: expiry_date ? new Date(expiry_date) : null,
        reason_for_issuance,
        fitness_status,
        recommendations,
        attachment_path,
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

    res.json(updatedNotice);
  } catch (error) {
    console.error("Error updating notice:", error);
    res.status(500).json({ message: "Failed to update notice" });
  }
};

// Delete a notice
export const deleteNotice = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const noticeId = parseInt(req.params.id);
    if (isNaN(noticeId)) {
      res.status(400).json({ message: "Invalid notice ID" });
      return;
    }

    // Check if notice exists
    const existingNotice = await prisma.notices.findUnique({
      where: { notice_id: noticeId },
    });

    if (!existingNotice) {
      res.status(404).json({ message: "Notice not found" });
      return;
    }

    // Delete the notice
    await prisma.notices.delete({
      where: { notice_id: noticeId },
    });

    res.json({ message: "Notice deleted successfully" });
  } catch (error) {
    console.error("Error deleting notice:", error);
    res.status(500).json({ message: "Failed to delete notice" });
  }
};

// Get services for creating notices
export const getServicesForNotices = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const services = await prisma.service.findMany({
      where: {
        status: "Completed", // Only show completed services
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

    res.json(services);
  } catch (error) {
    console.error("Error fetching services for notices:", error);
    res.status(500).json({ message: "Failed to fetch services" });
  }
};

// Get patients for creating notices
export const getPatientsForNotices = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const patients = await prisma.patient.findMany({
      include: {
        user: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
            is_active: true,
          },
        },
        serviceParticipants: true,
      },
      where: {
        user: {
          is_active: true,
        },
      },
    });

    res.json(patients);
  } catch (error) {
    console.error("Error fetching patients for notices:", error);
    res.status(500).json({ message: "Failed to fetch patients" });
  }
};

// Generate unique notice number
export const generateNoticeNumber = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed (0 for Jan, 11 for Dec)

    // First day of the current month
    const startDate = new Date(year, month, 1);
    // First day of the next month
    const endDate = new Date(year, month + 1, 1);

    // Count notices from the current month
    const noticesCount = await prisma.notices.count({
      where: {
        issue_date: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    // Format the month part of the number (e.g., '06' for June)
    const monthString = String(month + 1).padStart(2, "0");
    // Generate a sequence number padded with zeros
    const sequence = String(noticesCount + 1).padStart(3, "0");

    // Format: NOTICE-YYYYMM-XXX
    const noticeNumber = `NOTICE-${year}${monthString}-${sequence}`;

    res.json({ noticeNumber });
  } catch (error) {
    console.error("Error generating notice number:", error);
    res.status(500).json({ message: "Failed to generate notice number" });
  }
};
