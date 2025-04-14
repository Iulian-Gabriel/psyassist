import prisma from "../utils/prisma";
import { Employee, Doctor, User } from "@prisma/client";
import * as userService from "./userService";
import bcrypt from "bcrypt";

// Types for create operations
export type EmployeeCreateInput = {
  user_id: number;
  job_title: string;
  hire_date: Date;
  termination_date?: Date | null;
};

export type DoctorCreateInput = {
  employee_id: number;
  specialization?: string | null;
  bio?: string | null;
};

// Get all employees with their user info
export async function getAllEmployees() {
  try {
    return await prisma.employee.findMany({
      include: {
        user: {
          select: {
            user_id: true,
            email: true,
            first_name: true,
            last_name: true,
            phone_number: true,
            is_active: true,
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
        doctor: true,
      },
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw error;
  }
}

// Get employee by ID
export async function getEmployeeById(id: number) {
  try {
    return await prisma.employee.findUnique({
      where: { employee_id: id },
      include: {
        user: {
          select: {
            user_id: true,
            email: true,
            first_name: true,
            last_name: true,
            phone_number: true,
            is_active: true,
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
        doctor: true,
      },
    });
  } catch (error) {
    console.error(`Error fetching employee with ID ${id}:`, error);
    throw error;
  }
}

// Create a new employee
export async function createEmployee(
  data: EmployeeCreateInput
): Promise<Employee> {
  try {
    return await prisma.employee.create({
      data: {
        user_id: data.user_id,
        job_title: data.job_title,
        hire_date: data.hire_date,
        termination_date: data.termination_date,
      },
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    throw error;
  }
}

// Create a doctor (requires an existing employee)
export async function createDoctor(data: DoctorCreateInput): Promise<Doctor> {
  try {
    return await prisma.doctor.create({
      data: {
        employee_id: data.employee_id,
        specialization: data.specialization,
        bio: data.bio,
      },
    });
  } catch (error) {
    console.error("Error creating doctor:", error);
    throw error;
  }
}

// Create an employee and assign the doctor or admin role in a transaction
export async function createEmployeeWithRole(
  userData: userService.UserCreateInput,
  employeeData: Omit<EmployeeCreateInput, "user_id">,
  roleName: "doctor" | "admin",
  doctorData?: Omit<DoctorCreateInput, "employee_id">
): Promise<{ user: User; employee: Employee; doctor?: Doctor }> {
  try {
    return await prisma.$transaction(async (tx) => {
      // Create the user with required phone number
      const user = await tx.user.create({
        data: {
          email: userData.email,
          password_hash: await userService.hashPassword(userData.password),
          first_name: userData.first_name,
          last_name: userData.last_name,
          date_of_birth: userData.date_of_birth,
          gender: userData.gender || "unspecified",
          phone_number: userData.phone_number, // Required - no null or empty string
          address_street: userData.address_street,
          address_city: userData.address_city,
          address_postal_code: userData.address_postal_code,
          address_country: userData.address_country,
          address_county: userData.address_county,
        },
      });

      // 2. Create the employee
      const employee = await tx.employee.create({
        data: {
          user_id: user.user_id,
          job_title: employeeData.job_title,
          hire_date: employeeData.hire_date || new Date(),
          termination_date: employeeData.termination_date,
        },
      });

      // 3. Find the role
      const role = await tx.role.findUnique({
        where: { role_name: roleName },
      });

      if (!role) {
        throw new Error(`${roleName} role not found`);
      }

      // 4. Assign role to user
      await tx.userRoles.create({
        data: {
          user_id: user.user_id,
          role_id: role.role_id,
        },
      });

      // 5. If doctor role, create doctor record
      let doctor;
      if (roleName === "doctor" && doctorData) {
        doctor = await tx.doctor.create({
          data: {
            employee_id: employee.employee_id,
            specialization: doctorData.specialization,
            bio: doctorData.bio,
          },
        });
      }

      return { user, employee, doctor };
    });
  } catch (error) {
    console.error(`Error creating ${roleName}:`, error);
    throw error;
  }
}
