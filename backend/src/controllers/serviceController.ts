import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { AuthenticatedRequest } from "../middleware/auth";

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
