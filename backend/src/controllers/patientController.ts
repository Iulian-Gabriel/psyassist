import { Request, Response } from "express";
import * as userService from "../services/userService";
import prisma from "../utils/prisma";
import { AuthenticatedRequest } from "../middleware/auth";

// Create a new patient
export const createPatient = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      // User data
      email,
      password,
      first_name,
      last_name,
      date_of_birth,
      gender,
      phone_number,
      address_street,
      address_city,
      address_postal_code,
      address_country,
      address_county,

      // Patient-specific data
      emergency_contact_name,
      emergency_contact_phone,

      // Consent data
      tos_accepted,
      gdpr_accepted,
      tos_accepted_date,
      gdpr_accepted_date,
    } = req.body;

    // Validate required fields
    if (
      !email ||
      !password ||
      !first_name ||
      !last_name ||
      !date_of_birth ||
      !phone_number
    ) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Check if email already exists
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      res.status(409).json({ message: "Email already in use", field: "email" });
      return;
    }

    // Create user and patient in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password_hash: await userService.hashPassword(password),
          first_name,
          last_name,
          date_of_birth: new Date(date_of_birth),
          gender: gender || "unspecified",
          phone_number,
          address_street,
          address_city,
          address_postal_code,
          address_country,
          address_county,
        },
      });

      // Find the patient role
      const patientRole = await tx.role.findUnique({
        where: { role_name: "patient" },
      });

      if (!patientRole) {
        throw new Error("Patient role not found");
      }

      // Assign the patient role to the user
      await tx.userRoles.create({
        data: {
          user_id: user.user_id,
          role_id: patientRole.role_id,
        },
      });

      // Create patient record
      const patient = await tx.patient.create({
        data: {
          user_id: user.user_id,
          emergency_contact_name,
          emergency_contact_phone,
          tos_accepted: tos_accepted || false,
          gdpr_accepted: gdpr_accepted || false,
          tos_accepted_date: tos_accepted_date
            ? new Date(tos_accepted_date)
            : null,
          gdpr_accepted_date: gdpr_accepted_date
            ? new Date(gdpr_accepted_date)
            : null,
        },
      });

      return { user, patient };
    });

    res.status(201).json({
      message: "Patient created successfully",
      data: {
        user_id: result.user.user_id,
        patient_id: result.patient.patient_id,
        email: result.user.email,
        first_name: result.user.first_name,
        last_name: result.user.last_name,
      },
    });
  } catch (error: any) {
    console.error("Error creating patient:", error);

    // Handle unique constraint violations
    if (error.code === "P2002") {
      if (error.meta?.target?.includes("email")) {
        res.status(409).json({
          message: "Email already in use",
          field: "email",
        });
      } else if (error.meta?.target?.includes("phone_number")) {
        res.status(409).json({
          message: "Phone number already in use",
          field: "phone_number",
        });
      } else {
        res.status(409).json({
          message: "A unique constraint was violated",
        });
      }
      return;
    }

    res.status(500).json({ message: "Failed to create patient" });
  }
};

// Get all patients (for admin view)
export const getAllPatients = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const patients = await prisma.patient.findMany({
      include: {
        user: {
          select: {
            user_id: true,
            email: true,
            first_name: true,
            last_name: true,
            is_active: true,
          },
        },
      },
    });
    res.json(patients);
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ message: "Failed to fetch patients" });
  }
};

// Get patient by ID
export const getPatientById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const patientId = parseInt(req.params.id, 10);
    if (isNaN(patientId)) {
      res.status(400).json({ message: "Invalid patient ID" });
      return;
    }

    const patient = await prisma.patient.findUnique({
      where: { patient_id: patientId },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!patient) {
      res.status(404).json({ message: "Patient not found" });
      return;
    }

    res.json(patient);
  } catch (error) {
    console.error("Error fetching patient:", error);
    res.status(500).json({ message: "Failed to fetch patient" });
  }
};

// Deactivate a patient
export const deactivatePatient = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const patientId = parseInt(req.params.id, 10);
    if (isNaN(patientId)) {
      res.status(400).json({ message: "Invalid patient ID" });
      return;
    }

    // Find the patient first
    const patient = await prisma.patient.findUnique({
      where: { patient_id: patientId },
      select: { user_id: true },
    });

    if (!patient) {
      res.status(404).json({ message: "Patient not found" });
      return;
    }

    // Update the user record to set is_active = false
    await prisma.user.update({
      where: { user_id: patient.user_id },
      data: { is_active: false },
    });

    res.json({ message: "Patient deactivated successfully" });
  } catch (error) {
    console.error("Error deactivating patient:", error);
    res.status(500).json({ message: "Failed to deactivate patient" });
  }
};

// Add this function with your other patient controller functions
export const reactivatePatient = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const patientId = parseInt(req.params.id, 10);
    if (isNaN(patientId)) {
      res.status(400).json({ message: "Invalid patient ID" });
      return;
    }

    // Find the patient first
    const patient = await prisma.patient.findUnique({
      where: { patient_id: patientId },
      select: { user_id: true },
    });

    if (!patient) {
      res.status(404).json({ message: "Patient not found" });
      return;
    }

    // Update the user record to set is_active = true
    await prisma.user.update({
      where: { user_id: patient.user_id },
      data: { is_active: true },
    });

    res.json({ message: "Patient reactivated successfully" });
  } catch (error) {
    console.error("Error reactivating patient:", error);
    res.status(500).json({ message: "Failed to reactivate patient" });
  }
};

// Update a patient
export const updatePatient = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const patientId = parseInt(req.params.id, 10);
    if (isNaN(patientId)) {
      res.status(400).json({ message: "Invalid patient ID" });
      return;
    }

    const { user, emergency_contact_name, emergency_contact_phone } = req.body;

    // Find the patient first
    const patient = await prisma.patient.findUnique({
      where: { patient_id: patientId },
      include: { user: true },
    });

    if (!patient) {
      res.status(404).json({ message: "Patient not found" });
      return;
    }

    // Update in a transaction
    await prisma.$transaction(async (tx) => {
      // Update user data
      if (user) {
        await tx.user.update({
          where: { user_id: patient.user_id },
          data: {
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            phone_number: user.phone_number,
            date_of_birth: user.date_of_birth
              ? new Date(user.date_of_birth)
              : undefined,
            gender: user.gender,
            address_street: user.address_street,
            address_city: user.address_city,
            address_postal_code: user.address_postal_code,
            address_country: user.address_country,
            address_county: user.address_county,
          },
        });

        // Update roles if provided
        if (user.roles && Array.isArray(user.roles)) {
          // Delete existing roles
          await tx.userRoles.deleteMany({
            where: {
              user_id: patient.user_id,
            },
          });

          // Add new roles
          for (const roleId of user.roles) {
            await tx.userRoles.create({
              data: {
                user_id: patient.user_id,
                role_id: roleId,
              },
            });
          }
        }
      }

      // Update patient-specific data
      await tx.patient.update({
        where: { patient_id: patientId },
        data: {
          emergency_contact_name,
          emergency_contact_phone,
        },
      });
    });

    res.json({ message: "Patient updated successfully" });
  } catch (error) {
    console.error("Error updating patient:", error);

    // Handle unique constraint violations
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      const e = error as { meta?: { target?: string[] } };
      if (e.meta?.target?.includes("email")) {
        res.status(409).json({
          message: "Email already in use",
          field: "email",
        });
      } else if (e.meta?.target?.includes("phone_number")) {
        res.status(409).json({
          message: "Phone number already in use",
          field: "phone_number",
        });
      } else {
        res.status(409).json({
          message: "A unique constraint was violated",
        });
      }
      return;
    }

    res.status(500).json({ message: "Failed to update patient" });
  }
};

// Get patient's appointment history
export const getPatientAppointmentsHistory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    // Find the patient record associated with this user ID
    const patient = await prisma.patient.findUnique({
      where: { user_id: userId },
      select: { patient_id: true },
    });

    if (!patient) {
      res.status(404).json({ message: "Patient profile not found" });
      return;
    }

    // Get all appointments for this patient
    const appointments = await prisma.service.findMany({
      where: {
        serviceParticipants: {
          some: {
            patient_id: patient.patient_id,
          },
        },
      },
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
        serviceParticipants: {
          where: {
            patient_id: patient.patient_id,
          },
          select: {
            attendance_status: true,
          },
        },
      },
      orderBy: {
        start_time: "desc",
      },
    });

    // Format the response to include attendance status
    const formattedAppointments = appointments.map((appointment) => ({
      service_id: appointment.service_id,
      service_type: appointment.service_type,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      status: appointment.status,
      cancel_reason: appointment.cancel_reason,
      doctor: {
        name: `Dr. ${appointment.doctor.employee.user.first_name} ${appointment.doctor.employee.user.last_name}`,
        specialization: appointment.doctor.specialization,
      },
      attendance_status:
        appointment.serviceParticipants.find(
          (p) => p.attendance_status !== undefined
        )?.attendance_status || "Unknown",
    }));

    res.json(formattedAppointments);
  } catch (error) {
    console.error("Error fetching patient appointments:", error);
    res.status(500).json({ message: "Failed to fetch appointment history" });
  }
};
