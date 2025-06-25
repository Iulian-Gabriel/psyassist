import { Request, Response } from "express";
import * as doctorService from "../services/doctorService";
import * as userService from "../services/userService";
import prisma from "../utils/prisma";
import { AuthenticatedRequest } from "../middleware/auth";

// Get all doctors
export const getAllDoctors = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const doctors = await doctorService.getAllDoctors();
    res.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: "Failed to fetch doctors" });
  }
};

// Get doctor by ID
export const getDoctorById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: "Invalid doctor ID" });
      return;
    }

    const doctor = await doctorService.getDoctorById(id);
    if (!doctor) {
      res.status(404).json({ message: "Doctor not found" });
      return;
    }

    res.json(doctor);
  } catch (error) {
    console.error("Error fetching doctor:", error);
    res.status(500).json({ message: "Failed to fetch doctor" });
  }
};

// Create a new doctor (with associated user and employee records)
export const createDoctor = async (
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

      // Employee data
      job_title,
      hire_date,

      // Doctor data
      specialization,
      bio,
    } = req.body;

    // Validate required fields
    if (
      !email ||
      !password ||
      !first_name ||
      !last_name ||
      !date_of_birth ||
      !job_title ||
      !phone_number
    ) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Check if email already exists
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      res.status(409).json({ message: "Email already in use" });
      return;
    }

    // Create doctor with all associated records
    const result = await doctorService.createDoctorWithUserAndEmployee(
      {
        email,
        password,
        first_name,
        last_name,
        date_of_birth: new Date(date_of_birth),
        gender,
        phone_number,
        address_street,
        address_city,
        address_postal_code,
        address_country,
        address_county,
      },
      {
        job_title,
        hire_date: hire_date ? new Date(hire_date) : new Date(),
      },
      { specialization, bio }
    );

    res.status(201).json({
      message: "Doctor created successfully",
      data: {
        user_id: result.user.user_id,
        employee_id: result.employee.employee_id,
        doctor_id: result.doctor?.doctor_id,
        email: result.user.email,
        first_name: result.user.first_name,
        last_name: result.user.last_name,
        job_title: result.employee.job_title,
        specialization: result.doctor?.specialization,
      },
    });
  } catch (error: any) {
    console.error("Error creating doctor:", error);

    // Extract phone_number from the request body to use in the error check
    const { phone_number } = req.body;

    // Only check for P2002 errors with phone_number target when phone_number was actually provided
    if (
      error.code === "P2002" &&
      error.meta?.target?.includes("phone_number") &&
      phone_number
    ) {
      res.status(409).json({
        message: "Phone number already in use",
        field: "phone_number",
      });
      return;
    } else if (
      error.code === "P2002" &&
      error.meta?.target?.includes("email")
    ) {
      res.status(409).json({
        message: "Email already in use",
        field: "email",
      });
      return;
    }

    res.status(500).json({ message: "Failed to create doctor" });
  }
};

// Deactivate a doctor
export const deactivateDoctor = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const doctorId = parseInt(req.params.id, 10);
    if (isNaN(doctorId)) {
      res.status(400).json({ message: "Invalid doctor ID" });
      return;
    }

    // First get the doctor to find the associated employee and user
    const doctor = await prisma.doctor.findUnique({
      where: { doctor_id: doctorId },
      select: { employee_id: true, employee: { select: { user_id: true } } },
    });

    if (!doctor) {
      res.status(404).json({ message: "Doctor not found" });
      return;
    }

    // Deactivate the associated user
    await prisma.user.update({
      where: { user_id: doctor.employee.user_id },
      data: { is_active: false },
    });

    res.json({ message: "Doctor deactivated successfully" });
  } catch (error) {
    console.error("Error deactivating doctor:", error);
    res.status(500).json({ message: "Failed to deactivate doctor" });
  }
};

// Reactivate a doctor
export const reactivateDoctor = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const doctorId = parseInt(req.params.id, 10);
    if (isNaN(doctorId)) {
      res.status(400).json({ message: "Invalid doctor ID" });
      return;
    }

    // First get the doctor to find the associated employee and user
    const doctor = await prisma.doctor.findUnique({
      where: { doctor_id: doctorId },
      select: { employee_id: true, employee: { select: { user_id: true } } },
    });

    if (!doctor) {
      res.status(404).json({ message: "Doctor not found" });
      return;
    }

    // Reactivate the associated user
    await prisma.user.update({
      where: { user_id: doctor.employee.user_id },
      data: { is_active: true },
    });

    res.json({ message: "Doctor reactivated successfully" });
  } catch (error) {
    console.error("Error reactivating doctor:", error);
    res.status(500).json({ message: "Failed to reactivate doctor" });
  }
};

// Update a doctor
export const updateDoctor = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const doctorId = parseInt(req.params.id, 10);
    if (isNaN(doctorId)) {
      res.status(400).json({ message: "Invalid doctor ID" });
      return;
    }

    // First, get the doctor to find the associated employee and user
    const doctor = await prisma.doctor.findUnique({
      where: { doctor_id: doctorId },
      include: { employee: true },
    });

    if (!doctor) {
      res.status(404).json({ message: "Doctor not found" });
      return;
    }

    // Extract data from request body
    const {
      user: userData,
      job_title,
      hire_date,
      specialization,
      bio,
    } = req.body;

    // Update in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update the doctor record
      await tx.doctor.update({
        where: { doctor_id: doctorId },
        data: {
          specialization,
          bio,
        },
      });

      // 2. Update the employee record
      await tx.employee.update({
        where: { employee_id: doctor.employee_id },
        data: {
          job_title,
          hire_date: hire_date ? new Date(hire_date) : undefined,
        },
      });

      // 3. Update the associated user record
      if (userData) {
        await tx.user.update({
          where: { user_id: doctor.employee.user_id },
          data: {
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            date_of_birth: userData.date_of_birth
              ? new Date(userData.date_of_birth)
              : undefined,
            gender: userData.gender,
            phone_number: userData.phone_number,
            address_street: userData.address_street,
            address_city: userData.address_city,
            address_postal_code: userData.address_postal_code,
            address_country: userData.address_country,
            address_county: userData.address_county,
          },
        });
      }

      // 4. Handle role updates if needed
      if (userData && Array.isArray(userData.roles)) {
        // Delete existing roles
        await tx.userRoles.deleteMany({
          where: { user_id: doctor.employee.user_id },
        });

        // Check if doctor role is already in the roles array
        const doctorRole = await tx.role.findUnique({
          where: { role_name: "doctor" },
        });

        if (doctorRole) {
          // Check if the doctor role ID is already in the roles array
          const hasDoctorRole = userData.roles.includes(doctorRole.role_id);

          // Add doctor role if it's not already in the array
          if (!hasDoctorRole) {
            userData.roles.push(doctorRole.role_id);
          }
        }

        // Add selected roles
        for (const roleId of userData.roles) {
          await tx.userRoles.create({
            data: {
              user_id: doctor.employee.user_id,
              role_id: roleId,
            },
          });
        }
      }
    });

    res.json({ message: "Doctor updated successfully" });
  } catch (error) {
    console.error("Error updating doctor:", error);
    res.status(500).json({ message: "Failed to update doctor" });
  }
};

// Get current doctor for the authenticated user
export const getCurrentDoctor = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const employee = await prisma.employee.findUnique({
      where: { user_id: userId },
    });

    if (!employee) {
      res.status(404).json({ message: "Employee record not found" });
      return;
    }

    const doctor = await prisma.doctor.findUnique({
      where: { employee_id: employee.employee_id },
    });

    if (!doctor) {
      res.status(404).json({ message: "Doctor record not found" });
      return;
    }

    res.json({
      doctorId: doctor.doctor_id,
      employeeId: employee.employee_id,
      jobTitle: employee.job_title,
      specialization: doctor.specialization,
      bio: doctor.bio,
    });
  } catch (error) {
    console.error("Error getting current doctor:", error);
    res.status(500).json({ message: "Failed to fetch doctor data" });
  }
};

export const getDoctorPatients = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    // 1. Find the Doctor profile associated with the logged-in User
    const doctor = await prisma.doctor.findFirst({
      where: {
        employee: {
          // Navigate through the 'employee' relation from Doctor to Employee
          user_id: userId, // Match the user_id from the authenticated token
        },
      },
      select: {
        doctor_id: true, // We need the doctor_id to filter services
      },
    });

    if (!doctor) {
      // If the authenticated user is not associated with a doctor profile.
      // Returning 403 (Forbidden) is more accurate than 404 here, as the user might exist,
      // but they don't have the required doctor role/profile for this action.
      res.status(403).json({
        message: "Access denied. User is not associated with a doctor profile.",
      });
      return;
    }

    // 2. Find all unique patients who have participated in services
    //    where this doctor (`doctor.doctor_id`) was the assigned doctor.
    const patients = await prisma.patient.findMany({
      where: {
        serviceParticipants: {
          // A patient must have participated in a service
          some: {
            // At least one service participant record exists
            service: {
              // And that service is linked to this doctor
              // Based on your schema: Service.employee_id is the foreign key
              // that references Doctor.doctor_id.
              employee_id: doctor.doctor_id, // Use the doctor_id we just retrieved
            },
          },
        },
        user: {
          is_active: true, // Only include active patients
        },
      },
      include: {
        user: {
          // Include related user data for display
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
            // Add any other user fields you need
          },
        },
      },
      orderBy: {
        user: {
          last_name: "asc", // Order results for better readability
        },
      },
      distinct: ["patient_id"], // Ensure each patient is listed only once
    });

    // The 'patients' array now directly contains the Patient objects
    // with their associated User data, as fetched by Prisma.
    res.json(patients);
  } catch (error) {
    console.error("Error fetching doctor's patients:", error);
    // Provide a more generic error message for security/simplicity
    res.status(500).json({
      message:
        "Failed to fetch doctor's patients due to an internal server error.",
    });
  }
};
