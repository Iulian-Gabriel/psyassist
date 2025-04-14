import { Request, Response } from "express";
import * as employeeService from "../services/employeeService";
import * as userService from "../services/userService";
import prisma from "../utils/prisma";

// Get all employees (for admin view)
export const getAllEmployees = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const employees = await employeeService.getAllEmployees();
    res.json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ message: "Failed to fetch employees" });
  }
};

// Get employee by ID
export const getEmployeeById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: "Invalid employee ID" });
      return;
    }

    const employee = await employeeService.getEmployeeById(id);
    if (!employee) {
      res.status(404).json({ message: "Employee not found" });
      return;
    }

    res.json(employee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({ message: "Failed to fetch employee" });
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
      !phone_number // Add this line to make phone_number required
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
    const result = await employeeService.createEmployeeWithRole(
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
      "doctor",
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
      phone_number // Only if phone number was provided
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

// Create a new admin (with associated user and employee records)
export const createAdmin = async (
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
      !phone_number // Add this line to make phone_number required
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

    // Create admin with all associated records
    const result = await employeeService.createEmployeeWithRole(
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
      "admin"
    );

    res.status(201).json({
      message: "Admin created successfully",
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
    console.error("Error creating admin:", error);

    // Extract phone_number from the request body to use in the error check
    const { phone_number } = req.body;

    // Only check for P2002 errors with phone_number target when phone_number was actually provided
    if (
      error.code === "P2002" &&
      error.meta?.target?.includes("phone_number") &&
      phone_number // Only if phone number was provided
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

    res.status(500).json({ message: "Failed to create admin" });
  }
};

// Add this to your employeeController.ts
export const deactivateEmployee = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const employeeId = parseInt(req.params.id, 10);
    if (isNaN(employeeId)) {
      res.status(400).json({ message: "Invalid employee ID" });
      return;
    }

    // First get the employee to find the associated user
    const employee = await prisma.employee.findUnique({
      where: { employee_id: employeeId },
      select: { user_id: true },
    });

    if (!employee) {
      res.status(404).json({ message: "Employee not found" });
      return;
    }

    // Deactivate the associated user
    await prisma.user.update({
      where: { user_id: employee.user_id },
      data: { is_active: false },
    });

    res.json({ message: "Employee deactivated successfully" });
  } catch (error) {
    console.error("Error deactivating employee:", error);
    res.status(500).json({ message: "Failed to deactivate employee" });
  }
};

// Add this function to handle employee updates with role changes

export const updateEmployee = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const employeeId = parseInt(req.params.id, 10);
    if (isNaN(employeeId)) {
      res.status(400).json({ message: "Invalid employee ID" });
      return;
    }

    // First, get the employee to find the associated user ID
    const employee = await prisma.employee.findUnique({
      where: { employee_id: employeeId },
    });

    if (!employee) {
      res.status(404).json({ message: "Employee not found" });
      return;
    }

    // Extract user data and roles from request body
    const { user: userData, job_title, hire_date } = req.body;

    // Update in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update the employee record
      await tx.employee.update({
        where: { employee_id: employeeId },
        data: {
          job_title,
          hire_date: hire_date ? new Date(hire_date) : undefined,
        },
      });

      // 2. Update the associated user record
      await tx.user.update({
        where: { user_id: employee.user_id },
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

      // 3. Handle role updates
      if (Array.isArray(userData.roles)) {
        // Delete existing roles
        await tx.userRoles.deleteMany({
          where: { user_id: employee.user_id },
        });

        // Add selected roles
        for (const roleId of userData.roles) {
          await tx.userRoles.create({
            data: {
              user_id: employee.user_id,
              role_id: roleId,
            },
          });
        }
      }
    });

    res.json({ message: "Employee updated successfully" });
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({ message: "Failed to update employee" });
  }
};
