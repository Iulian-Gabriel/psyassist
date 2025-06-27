import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { AuthenticatedRequest } from "../middleware/auth";

// Get all notices (for Admin/Receptionist)
export const getAllNotices = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const notices = await prisma.notices.findMany({
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
    console.error("Error fetching notices:", error);
    res.status(500).json({ message: "Failed to fetch notices" });
  }
};

export const getLoggedInPatientNotices = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId; // Get the user ID from the authenticated token

    if (!userId) {
      res
        .status(401)
        .json({ message: "Unauthorized: User ID not found in token." });
      return;
    }

    // Find the patient profile linked to this user ID
    const patient = await prisma.patient.findUnique({
      where: { user_id: userId },
      select: { patient_id: true }, // Only need the patient_id for the query
    });

    if (!patient) {
      res
        .status(404)
        .json({ message: "Patient profile not found for this user." });
      return;
    }

    // Now, fetch all notices associated with this patient_id
    const notices = await prisma.notices.findMany({
      where: {
        // Correctly link through serviceParticipant to the patient_id
        serviceParticipant: {
          patient_id: patient.patient_id,
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
        // It's good to include serviceParticipant and patient info
        // even if you already know the patient is the logged-in user,
        // for consistency in data structure.
        serviceParticipant: {
          include: {
            patient: {
              include: {
                user: {
                  select: {
                    first_name: true,
                    last_name: true,
                    date_of_birth: true,
                    gender: true,
                  },
                },
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
    console.error("Error fetching logged-in patient notices:", error);
    res.status(500).json({ message: "Failed to fetch your notices" });
  }
};

// Get notices for the logged-in doctor
export const getDoctorNotices = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const employee = await prisma.employee.findUnique({
      where: { user_id: userId },
    });

    if (!employee) {
      res.status(404).json({ message: "Employee not found for this user" });
      return;
    }

    const doctor = await prisma.doctor.findUnique({
      where: { employee_id: employee.employee_id },
    });

    if (!doctor) {
      res.status(404).json({ message: "Doctor profile not found" });
      return;
    }

    const notices = await prisma.notices.findMany({
      where: {
        service: {
          employee_id: doctor.doctor_id, // This should match the foreign key in the service table
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
    console.error("Error fetching doctor notices:", error);
    res.status(500).json({ message: "Failed to fetch doctor notices" });
  }
};

// Get notice by ID
export const getNoticeById = async (
  req: AuthenticatedRequest,
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
  req: AuthenticatedRequest,
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
  req: AuthenticatedRequest,
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

    if (!service_id || !participant_id) {
      res
        .status(400)
        .json({ message: "Service ID and Participant ID are required" });
      return;
    }

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
  req: AuthenticatedRequest,
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

    const existingNotice = await prisma.notices.findUnique({
      where: { notice_id: noticeId },
    });

    if (!existingNotice) {
      res.status(404).json({ message: "Notice not found" });
      return;
    }

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
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const noticeId = parseInt(req.params.id);
    if (isNaN(noticeId)) {
      res.status(400).json({ message: "Invalid notice ID" });
      return;
    }

    const existingNotice = await prisma.notices.findUnique({
      where: { notice_id: noticeId },
    });

    if (!existingNotice) {
      res.status(404).json({ message: "Notice not found" });
      return;
    }

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
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const services = await prisma.service.findMany({
      where: {
        status: "Completed",
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
  req: AuthenticatedRequest,
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
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 1);

    const noticesCount = await prisma.notices.count({
      where: {
        issue_date: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    const monthString = String(month + 1).padStart(2, "0");
    const sequence = String(noticesCount + 1).padStart(3, "0");

    const noticeNumber = `NOTICE-${year}${monthString}-${sequence}`;

    res.json({ noticeNumber });
  } catch (error) {
    console.error("Error generating notice number:", error);
    res.status(500).json({ message: "Failed to generate notice number" });
  }
};
