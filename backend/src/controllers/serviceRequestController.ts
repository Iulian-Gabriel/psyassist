import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { z } from "zod";
// import { AuthenticatedRequest } from "../types/auth";

// Validation schema for creating service requests
const createServiceRequestSchema = z.object({
  patient_id: z.number().int().positive(),
  service_type_id: z.number().int().positive(),
  preferred_doctor_id: z.number().int().positive().optional(),
  preferred_date_1: z.string().refine((date) => !isNaN(Date.parse(date))),
  preferred_date_2: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)))
    .optional(),
  preferred_date_3: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)))
    .optional(),
  preferred_time: z.enum(["morning", "afternoon", "evening"]),
  reason: z.string().min(10),
  urgent: z.boolean().default(false),
  additional_notes: z.string().optional(),
});

// Get all service requests
export const getAllServiceRequests = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const serviceRequests = await prisma.serviceRequest.findMany({
      include: {
        patient: {
          include: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
                phone_number: true,
              },
            },
          },
        },
        service_type: true,
        preferred_doctor: {
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
      orderBy: [
        {
          urgent: "desc",
        },
        {
          created_at: "desc",
        },
      ],
    });

    res.json(serviceRequests);
  } catch (error) {
    console.error("Error fetching service requests:", error);
    res.status(500).json({ message: "Failed to fetch service requests" });
  }
};

// Get service request by ID
export const getServiceRequestById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const requestId = parseInt(req.params.id, 10);

    if (isNaN(requestId)) {
      res.status(400).json({ message: "Invalid request ID" });
      return;
    }

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { request_id: requestId },
      include: {
        patient: {
          include: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
                phone_number: true,
              },
            },
          },
        },
        service_type: true,
        preferred_doctor: {
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
    });

    if (!serviceRequest) {
      res.status(404).json({ message: "Service request not found" });
      return;
    }

    res.json(serviceRequest);
  } catch (error) {
    console.error("Error fetching service request:", error);
    res.status(500).json({ message: "Failed to fetch service request" });
  }
};

// Create a new service request
export const createServiceRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validatedData = createServiceRequestSchema.parse(req.body);

    const {
      patient_id,
      service_type_id,
      preferred_doctor_id,
      preferred_date_1,
      preferred_date_2,
      preferred_date_3,
      preferred_time,
      reason,
      urgent,
      additional_notes,
    } = validatedData;

    // Create new service request
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        patient: {
          connect: { patient_id: patient_id },
        },
        service_type: {
          connect: { service_type_id: service_type_id },
        },
        ...(preferred_doctor_id
          ? {
              preferred_doctor: { connect: { doctor_id: preferred_doctor_id } },
            }
          : {}),
        preferred_date_1: new Date(preferred_date_1),
        preferred_date_2: preferred_date_2 ? new Date(preferred_date_2) : null,
        preferred_date_3: preferred_date_3 ? new Date(preferred_date_3) : null,
        preferred_time,
        reason,
        urgent: urgent || false,
        additional_notes: additional_notes || null,
        status: "pending",
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        service_type: true,
      },
    });

    res.status(201).json({
      message: "Service request created successfully",
      serviceRequest,
    });
  } catch (error) {
    console.error("Error creating service request:", error);

    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ message: "Validation error", errors: error.errors });
      return;
    }

    res.status(500).json({ message: "Failed to create service request" });
  }
};

// Update service request status to approved
export const approveServiceRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const requestId = parseInt(req.params.id, 10);

    if (isNaN(requestId)) {
      res.status(400).json({ message: "Invalid request ID" });
      return;
    }

    const serviceRequest = await prisma.serviceRequest.update({
      where: { request_id: requestId },
      data: {
        status: "approved",
        updated_at: new Date(),
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
    });

    res.json({
      message: "Service request approved",
      serviceRequest,
    });
  } catch (error) {
    console.error("Error approving service request:", error);
    res.status(500).json({ message: "Failed to approve service request" });
  }
};

// Update service request status to rejected
export const rejectServiceRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const requestId = parseInt(req.params.id, 10);
    const { rejection_reason } = req.body;

    if (isNaN(requestId)) {
      res.status(400).json({ message: "Invalid request ID" });
      return;
    }

    const serviceRequest = await prisma.serviceRequest.update({
      where: { request_id: requestId },
      data: {
        status: "rejected",
        additional_notes: rejection_reason || "Request rejected by staff",
        updated_at: new Date(),
      },
    });

    res.json({
      message: "Service request rejected",
      serviceRequest,
    });
  } catch (error) {
    console.error("Error rejecting service request:", error);
    res.status(500).json({ message: "Failed to reject service request" });
  }
};

// Update service request status to scheduled after appointment is created
export const markServiceRequestScheduled = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const requestId = parseInt(req.params.id, 10);
    const { service_id } = req.body;

    if (isNaN(requestId) || !service_id) {
      res.status(400).json({ message: "Invalid request ID or service ID" });
      return;
    }

    const serviceRequest = await prisma.serviceRequest.update({
      where: { request_id: requestId },
      data: {
        status: "scheduled",
        updated_at: new Date(),
      },
    });

    res.json({
      message: "Service request marked as scheduled",
      serviceRequest,
    });
  } catch (error) {
    console.error("Error updating service request status:", error);
    res
      .status(500)
      .json({ message: "Failed to update service request status" });
  }
};

// Get service requests for a specific patient
export const getPatientServiceRequests = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const patientId = parseInt(req.params.patientId, 10);

    if (isNaN(patientId)) {
      res.status(400).json({ message: "Invalid patient ID" });
      return;
    }

    const serviceRequests = await prisma.serviceRequest.findMany({
      where: { patient_id: patientId },
      include: {
        service_type: true,
        preferred_doctor: {
          include: {
            employee: {
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

    res.json(serviceRequests);
  } catch (error) {
    console.error("Error fetching patient service requests:", error);
    res.status(500).json({ message: "Failed to fetch service requests" });
  }
};
