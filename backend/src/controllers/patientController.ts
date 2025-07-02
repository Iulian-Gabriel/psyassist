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

// Add this new function to your existing patientController.ts

export const getPatientAssessmentResults = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const patientId = parseInt(req.params.id);
    if (isNaN(patientId)) {
      res.status(400).json({ message: "Invalid patient ID" });
      return;
    }

    // First, check if the patient exists
    const patient = await prisma.patient.findUnique({
      where: { patient_id: patientId },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    if (!patient) {
      res.status(404).json({ message: "Patient not found" });
      return;
    }

    // Find the patient's initial assessment results
    const assessmentResults = await prisma.patientForm.findFirst({
      where: {
        patient_id: patientId,
        // You might want to add additional criteria here to ensure it's the initial assessment
      },
      orderBy: {
        submission_date: "desc", // Get the most recent assessment
      },
    });

    if (!assessmentResults) {
      // Return patient info but indicate no assessment taken
      res.json({
        form_id: null,
        submission_date: null,
        patient: patient,
        data: null,
        message: "Assessment not taken",
      });
      return;
    }

    // Transform the data to match the expected frontend structure
    const transformedData = {
      form_id: assessmentResults.form_id,
      submission_date: assessmentResults.submission_date,
      patient: patient,
      data: assessmentResults.form_data, // This should contain the scores and totalScore
    };

    res.json(transformedData);
  } catch (error) {
    console.error("Error fetching patient assessment results:", error);
    res.status(500).json({ message: "Failed to fetch assessment results" });
  }
};

// Replace your getPatientUpcomingAppointments function with this version

export const getPatientUpcomingAppointments = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const patient = await prisma.patient.findUnique({
      where: { user_id: userId },
      select: { patient_id: true },
    });

    if (!patient) {
      res.status(404).json({ message: "Patient profile not found" });
      return;
    }

    const now = new Date();

    // Get upcoming appointments with all necessary data included
    const upcomingAppointments = await prisma.service.findMany({
      where: {
        serviceParticipants: {
          some: {
            patient_id: patient.patient_id,
          },
        },
        status: "Scheduled",
        start_time: {
          gte: now,
        },
      },
      include: {
        serviceParticipants: {
          where: {
            patient_id: patient.patient_id,
          },
          select: {
            attendance_status: true,
          },
        },
        // Correctly include the nested relations
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
      orderBy: {
        start_time: "asc",
      },
    });

    // Map the results directly without another database call
    const formattedAppointments = upcomingAppointments.map((appointment) => {
      const doctorUser = appointment.doctor?.employee?.user;
      const doctorDetails = appointment.doctor;

      return {
        service_id: appointment.service_id,
        service_type: appointment.service_type,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        status: appointment.status,
        doctor: {
          name: doctorUser
            ? `Dr. ${doctorUser.first_name} ${doctorUser.last_name}`
            : "Unknown Doctor",
          specialization: doctorDetails?.specialization || "General",
        },
        attendance_status:
          appointment.serviceParticipants.find(
            (p: any) => p.attendance_status !== undefined
          )?.attendance_status || "Expected",
      };
    });

    res.json(formattedAppointments);
  } catch (error) {
    console.error("Error fetching upcoming appointments:", error);
    res.status(500).json({ message: "Failed to fetch upcoming appointments" });
  }
};

// Add this new function to your existing patientController.ts

export const cancelPatientAppointment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const serviceId = parseInt(req.params.serviceId);
    const { cancellation_reason } = req.body;

    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    if (isNaN(serviceId)) {
      res.status(400).json({ message: "Invalid service ID" });
      return;
    }

    // Find the patient record
    const patient = await prisma.patient.findUnique({
      where: { user_id: userId },
      select: { patient_id: true },
    });

    if (!patient) {
      res.status(404).json({ message: "Patient profile not found" });
      return;
    }

    // Check if the appointment exists and belongs to this patient
    const appointment = await prisma.service.findFirst({
      where: {
        service_id: serviceId,
        serviceParticipants: {
          some: {
            patient_id: patient.patient_id,
          },
        },
        status: "Scheduled", // Only allow cancelling scheduled appointments
      },
      include: {
        serviceParticipants: {
          where: {
            patient_id: patient.patient_id,
          },
        },
      },
    });

    if (!appointment) {
      res.status(404).json({
        message: "Appointment not found or cannot be cancelled",
      });
      return;
    }

    // Check if appointment is in the future (can't cancel past appointments)
    const now = new Date();
    if (appointment.start_time <= now) {
      res.status(400).json({
        message:
          "Cannot cancel appointments that have already started or passed",
      });
      return;
    }

    // Check if appointment is within 24 hours (optional business rule)
    const appointmentTime = new Date(appointment.start_time);
    const timeDiff = appointmentTime.getTime() - now.getTime();
    const hoursUntilAppointment = timeDiff / (1000 * 3600);

    if (hoursUntilAppointment < 24) {
      res.status(400).json({
        message:
          "Cannot cancel appointments within 24 hours. Please contact the office directly.",
      });
      return;
    }

    // Update the appointment status to cancelled
    const updatedAppointment = await prisma.service.update({
      where: { service_id: serviceId },
      data: {
        status: "Cancelled",
        cancel_reason: cancellation_reason || "Cancelled by patient",
        updated_at: new Date(),
      },
    });

    res.json({
      message: "Appointment cancelled successfully",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({ message: "Failed to cancel appointment" });
  }
};

// Get patient count
export const getPatientCount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { beforeDate } = req.query;

    let whereClause: any = {};

    if (beforeDate && typeof beforeDate === "string") {
      // Find patients where their user was created before the specified date
      whereClause = {
        user: {
          created_at: {
            lt: new Date(beforeDate), // Use 'lt' (less than) instead of 'lte'
          },
        },
      };
    }

    const count = await prisma.patient.count({
      where: whereClause,
    });

    res.json({ count });
  } catch (error) {
    console.error("Error fetching patient count:", error);
    res.status(500).json({
      message: "Failed to fetch patient count",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Add this function to your existing patientController.ts

export const getCurrentPatientProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const patient = await prisma.patient.findUnique({
      where: { user_id: userId },
      include: {
        user: {
          select: {
            user_id: true,
            email: true,
            first_name: true,
            last_name: true,
            phone_number: true,
            date_of_birth: true,
            gender: true,
            address_street: true,
            address_city: true,
            address_postal_code: true,
            address_country: true,
            address_county: true,
            is_active: true,
          },
        },
      },
    });

    if (!patient) {
      res.status(404).json({ message: "Patient profile not found" });
      return;
    }

    res.json(patient);
  } catch (error) {
    console.error("Error fetching current patient profile:", error);
    res.status(500).json({ message: "Failed to fetch patient profile" });
  }
};
