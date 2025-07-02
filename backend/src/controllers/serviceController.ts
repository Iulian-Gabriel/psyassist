import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { parseISO, startOfDay, endOfDay } from "date-fns";

// Get all services
export const getAllServices = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const services = await prisma.service.findMany({
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
    console.error("Error fetching services:", error);
    res.status(500).json({ message: "Failed to fetch services" });
  }
};

// Create a new service/appointment
export const createService = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      service_type,
      doctor_id,
      patient_id, // For single patient
      patient_ids, // For multiple patients (group consultation)
      start_time,
      end_time,
      notes,
    } = req.body;

    // Validate required fields
    if (!service_type || !doctor_id || !start_time || !end_time) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Check if we have at least one patient
    if (!patient_id && (!patient_ids || patient_ids.length === 0)) {
      res.status(400).json({ message: "At least one patient is required" });
      return;
    }

    // Create the service
    const service = await prisma.service.create({
      data: {
        service_type,
        doctor: {
          connect: {
            doctor_id: parseInt(doctor_id),
          },
        },
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        status: "Scheduled",
      },
    });

    // Add patient(s) as participant(s)
    if (service_type === "Consultation" && patient_id) {
      // For regular consultation - single patient
      await prisma.serviceParticipant.create({
        data: {
          service_id: service.service_id,
          patient_id: parseInt(patient_id),
          attendance_status: "Expected",
        },
      });
    } else if (patient_ids && patient_ids.length > 0) {
      // For group consultation - multiple patients
      await Promise.all(
        patient_ids.map(async (id: string) => {
          await prisma.serviceParticipant.create({
            data: {
              service_id: service.service_id,
              patient_id: parseInt(id),
              attendance_status: "Expected",
            },
          });
        })
      );
    }

    // Add notes if provided
    if (notes) {
      await prisma.notes.create({
        data: {
          doctor_id: parseInt(doctor_id),
          patient_id: parseInt(patient_id),
          service_id: service.service_id,
          content: notes,
        },
      });
    }

    // Return the created service with related data
    const createdService = await prisma.service.findUnique({
      where: { service_id: service.service_id },
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
    });

    res.status(201).json(createdService);
  } catch (error) {
    console.error("Error creating service:", error);
    res.status(500).json({ message: "Failed to create service" });
  }
};

// Get service by ID
export const getServiceById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const serviceId = parseInt(req.params.id);
    if (isNaN(serviceId)) {
      res.status(400).json({ message: "Invalid service ID" });
      return;
    }

    const service = await prisma.service.findUnique({
      where: { service_id: serviceId },
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
        notes: true,
      },
    });

    if (!service) {
      res.status(404).json({ message: "Service not found" });
      return;
    }

    res.json(service);
  } catch (error) {
    console.error("Error fetching service:", error);
    res.status(500).json({ message: "Failed to fetch service" });
  }
};

// Cancel a service
export const cancelService = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const serviceId = parseInt(req.params.id);
    if (isNaN(serviceId)) {
      res.status(400).json({ message: "Invalid service ID" });
      return;
    }

    const { cancel_reason } = req.body;

    const updatedService = await prisma.service.update({
      where: { service_id: serviceId },
      data: {
        status: "Cancelled",
        cancel_reason: cancel_reason || "Cancelled by user",
      },
    });

    res.json(updatedService);
  } catch (error) {
    console.error("Error cancelling service:", error);
    res.status(500).json({ message: "Failed to cancel service" });
  }
};

export const getDoctorServices = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    // Find the doctor_id for the authenticated user
    const doctor = await prisma.doctor.findFirst({
      where: {
        employee: {
          user_id: userId,
        },
      },
      select: {
        doctor_id: true,
      },
    });

    if (!doctor) {
      res
        .status(403)
        .json({ message: "Access denied. Not a recognized doctor." });
      return;
    }

    const services = await prisma.service.findMany({
      where: {
        employee_id: doctor.doctor_id, // Filter services by the doctor's ID
      },
      include: {
        doctor: {
          // Include doctor details even though we know it's *this* doctor, for consistent frontend data shape
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
    console.error("Error fetching doctor's services:", error);
    res.status(500).json({ message: "Failed to fetch doctor's services" });
  }
};

// CORRECTED function to get appointments by date
export const getAppointmentsByDate = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { date } = req.query;

    if (!date || typeof date !== "string") {
      res
        .status(400)
        .json({ message: "A valid date query parameter is required." });
      return;
    }

    const targetDate = parseISO(date);
    const startDate = startOfDay(targetDate);
    const endDate = endOfDay(targetDate);

    // 1. Fetch the data using the CORRECT relational path
    const appointmentsWithParticipants = await prisma.service.findMany({
      where: {
        start_time: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        // Correct path: Service -> serviceParticipants -> patient -> user
        serviceParticipants: {
          include: {
            patient: {
              include: {
                user: {
                  select: { first_name: true, last_name: true },
                },
              },
            },
          },
        },
        doctor: {
          include: {
            employee: {
              include: {
                user: {
                  select: { first_name: true, last_name: true },
                },
              },
            },
          },
        },
      },
      orderBy: {
        start_time: "asc",
      },
    });

    // 2. Reshape the data to match what the frontend expects
    const appointments = appointmentsWithParticipants.map((appt) => {
      // Assuming a standard appointment has one participant
      const patient = appt.serviceParticipants[0]?.patient || null;

      // Remove the complex serviceParticipants array from the final object
      const { serviceParticipants, ...restOfAppt } = appt;

      // Return a clean appointment object with a top-level 'patient' property
      return { ...restOfAppt, patient };
    });

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments by date:", error);
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
};

// Get appointments by date range
export const getAppointmentsByDateRange = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    if (
      !startDate ||
      !endDate ||
      typeof startDate !== "string" ||
      typeof endDate !== "string"
    ) {
      res.status(400).json({ message: "Start date and end date are required" });
      return;
    }

    const startDateTime = startOfDay(parseISO(startDate));
    const endDateTime = endOfDay(parseISO(endDate));

    const appointmentsWithParticipants = await prisma.service.findMany({
      where: {
        start_time: {
          gte: startDateTime,
          lte: endDateTime,
        },
      },
      include: {
        serviceParticipants: {
          include: {
            patient: {
              include: {
                user: {
                  select: { first_name: true, last_name: true },
                },
              },
            },
          },
        },
        doctor: {
          include: {
            employee: {
              include: {
                user: {
                  select: { first_name: true, last_name: true },
                },
              },
            },
          },
        },
      },
      orderBy: {
        start_time: "asc",
      },
    });

    // Reshape the data to match what the frontend expects
    const appointments = appointmentsWithParticipants.map((appt) => ({
      service_id: appt.service_id,
      service_type: appt.service_type,
      start_time: appt.start_time,
      end_time: appt.end_time,
      status: appt.status,
      cancel_reason: appt.cancel_reason,
      patient: appt.serviceParticipants[0]?.patient || null,
      doctor: {
        doctor_id: appt.doctor.doctor_id,
        employee: {
          user: {
            first_name: appt.doctor.employee.user.first_name,
            last_name: appt.doctor.employee.user.last_name,
          },
        },
      },
    }));

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments by date range:", error);
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
};

export const completeService = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const serviceId = parseInt(req.params.id, 10);
    if (isNaN(serviceId)) {
      res.status(400).json({ message: "Invalid service ID" });
      return;
    }

    const service = await prisma.service.findUnique({
      where: { service_id: serviceId },
    });

    if (!service) {
      res.status(404).json({ message: "Service not found" });
      return;
    }

    // You can add logic here to prevent completing an already cancelled service
    if (service.status === "Cancelled") {
      res.status(409).json({ message: "Cannot complete a cancelled service." });
      return;
    }

    const updatedService = await prisma.service.update({
      where: { service_id: serviceId },
      data: { status: "Completed" },
    });

    res.json(updatedService);
  } catch (error) {
    console.error("Error completing service:", error);
    res.status(500).json({ message: "Failed to complete service" });
  }
};
