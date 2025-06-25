import { Request, Response } from "express";
import * as receptionistService from "../services/receptionistService";
import * as userService from "../services/userService";
import prisma from "../utils/prisma";
import { AuthenticatedRequest } from "../middleware/auth";

// Get all receptionists
export const getAllReceptionists = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const receptionists = await receptionistService.getAllReceptionists();
    res.json(receptionists);
  } catch (error) {
    console.error("Error fetching receptionists:", error);
    res.status(500).json({ message: "Failed to fetch receptionists" });
  }
};

// Get receptionist by ID
export const getReceptionistById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: "Invalid receptionist ID" });
      return;
    }

    const receptionist = await receptionistService.getReceptionistById(id);
    if (!receptionist) {
      res.status(404).json({ message: "Receptionist not found" });
      return;
    }

    res.json(receptionist);
  } catch (error) {
    console.error("Error fetching receptionist:", error);
    res.status(500).json({ message: "Failed to fetch receptionist" });
  }
};

// Create a new receptionist (with associated user and employee records)
export const createReceptionist = async (
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

    // Create receptionist with all associated records
    const result =
      await receptionistService.createReceptionistWithUserAndEmployee(
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
        }
      );

    res.status(201).json({
      message: "Receptionist created successfully",
      data: {
        user_id: result.user.user_id,
        employee_id: result.employee.employee_id,
        email: result.user.email,
        first_name: result.user.first_name,
        last_name: result.user.last_name,
        job_title: result.employee.job_title,
      },
    });
  } catch (error: any) {
    console.error("Error creating receptionist:", error);

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

    res.status(500).json({ message: "Failed to create receptionist" });
  }
};

// Deactivate a receptionist
export const deactivateReceptionist = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const receptionistId = parseInt(req.params.id, 10);
    if (isNaN(receptionistId)) {
      res.status(400).json({ message: "Invalid receptionist ID" });
      return;
    }

    // First get the receptionist to find the associated employee and user
    const receptionist = await prisma.employee.findUnique({
      where: { employee_id: receptionistId },
      select: { user_id: true },
    });

    if (!receptionist) {
      res.status(404).json({ message: "Receptionist not found" });
      return;
    }

    // Deactivate the associated user
    await prisma.user.update({
      where: { user_id: receptionist.user_id },
      data: { is_active: false },
    });

    res.json({ message: "Receptionist deactivated successfully" });
  } catch (error) {
    console.error("Error deactivating receptionist:", error);
    res.status(500).json({ message: "Failed to deactivate receptionist" });
  }
};

// Reactivate a receptionist
export const reactivateReceptionist = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const receptionistId = parseInt(req.params.id, 10);
    if (isNaN(receptionistId)) {
      res.status(400).json({ message: "Invalid receptionist ID" });
      return;
    }

    // First get the receptionist to find the associated employee and user
    const receptionist = await prisma.employee.findUnique({
      where: { employee_id: receptionistId },
      select: { user_id: true },
    });

    if (!receptionist) {
      res.status(404).json({ message: "Receptionist not found" });
      return;
    }

    // Reactivate the associated user
    await prisma.user.update({
      where: { user_id: receptionist.user_id },
      data: { is_active: true },
    });

    res.json({ message: "Receptionist reactivated successfully" });
  } catch (error) {
    console.error("Error reactivating receptionist:", error);
    res.status(500).json({ message: "Failed to reactivate receptionist" });
  }
};

// Update a receptionist
export const updateReceptionist = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const receptionistId = parseInt(req.params.id, 10);
    if (isNaN(receptionistId)) {
      res.status(400).json({ message: "Invalid receptionist ID" });
      return;
    }

    // First, get the receptionist to find the associated employee and user
    const receptionist = await prisma.employee.findUnique({
      where: { employee_id: receptionistId },
    });

    if (!receptionist) {
      res.status(404).json({ message: "Receptionist not found" });
      return;
    }

    // Extract user data and roles from request body
    const { user: userData, job_title, hire_date } = req.body;

    // Update in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update the employee record
      await tx.employee.update({
        where: { employee_id: receptionistId },
        data: {
          job_title,
          hire_date: hire_date ? new Date(hire_date) : undefined,
        },
      });

      // 2. Update the associated user record
      if (userData) {
        await tx.user.update({
          where: { user_id: receptionist.user_id },
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

      // 3. Handle role updates if needed
      if (userData && Array.isArray(userData.roles)) {
        // Delete existing roles
        await tx.userRoles.deleteMany({
          where: { user_id: receptionist.user_id },
        });

        // Check if receptionist role is already in the roles array
        const receptionistRole = await tx.role.findUnique({
          where: { role_name: "receptionist" },
        });

        if (receptionistRole) {
          // Check if the receptionist role ID is already in the roles array
          const hasReceptionistRole = userData.roles.includes(
            receptionistRole.role_id
          );

          // Add receptionist role if it's not already in the array
          if (!hasReceptionistRole) {
            userData.roles.push(receptionistRole.role_id);
          }
        }

        // Add selected roles
        for (const roleId of userData.roles) {
          await tx.userRoles.create({
            data: {
              user_id: receptionist.user_id,
              role_id: roleId,
            },
          });
        }
      }
    });

    res.json({ message: "Receptionist updated successfully" });
  } catch (error) {
    console.error("Error updating receptionist:", error);
    res.status(500).json({ message: "Failed to update receptionist" });
  }
};

// Get current receptionist for the authenticated user
export const getCurrentReceptionist = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    // Convert userId to number if it's a string
    const userIdNumber =
      typeof userId === "string" ? parseInt(userId, 10) : userId;

    // First get the employee for this user
    const employee = await prisma.employee.findUnique({
      where: { user_id: userIdNumber },
    });

    if (!employee) {
      res.status(404).json({ message: "Employee record not found" });
      return;
    }

    // Check if the user has the receptionist role
    const userRoles = await prisma.userRoles.findMany({
      where: { user_id: userIdNumber },
      include: { role: true },
    });

    const isReceptionist = userRoles.some(
      (userRole) => userRole.role.role_name === "receptionist"
    );

    if (!isReceptionist) {
      // Instead of 403, return a more informative response
      res.status(200).json({
        message: "User is not a receptionist",
        isReceptionist: false,
      });
      return;
    }

    // Return receptionist data
    res.json({
      employeeId: employee.employee_id,
      jobTitle: employee.job_title,
      isReceptionist: true,
    });
  } catch (error) {
    console.error("Error getting current receptionist:", error);
    res.status(500).json({ message: "Failed to fetch receptionist data" });
  }
};
