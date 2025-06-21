import prisma from "../utils/prisma";
import { Doctor, Employee, User } from "@prisma/client";
import * as userService from "./userService";
import * as employeeService from "./employeeService";

export type DoctorCreateInput = {
  employee_id: number;
  specialization?: string | null;
  bio?: string | null;
};

// Get all doctors with their employee and user info
export async function getAllDoctors() {
  try {
    return await prisma.doctor.findMany({
      include: {
        employee: {
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
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    throw error;
  }
}

// Get doctor by ID
export async function getDoctorById(id: number) {
  try {
    return await prisma.doctor.findUnique({
      where: { doctor_id: id },
      include: {
        employee: {
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
          },
        },
      },
    });
  } catch (error) {
    console.error(`Error fetching doctor with ID ${id}:`, error);
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

// Create a doctor with associated user and employee records in a transaction
export async function createDoctorWithUserAndEmployee(
  userData: userService.UserCreateInput,
  employeeData: Omit<employeeService.EmployeeCreateInput, "user_id">,
  doctorData: Omit<DoctorCreateInput, "employee_id">
): Promise<{ user: User; employee: Employee; doctor: Doctor }> {
  try {
    const result = await employeeService.createEmployeeWithRole(
      userData,
      employeeData,
      "doctor",
      doctorData
    );

    // Since we're creating a doctor, we know doctor will be present
    return result as { user: User; employee: Employee; doctor: Doctor };
  } catch (error) {
    console.error("Error creating doctor:", error);
    throw error;
  }
}

// Update doctor information
export async function updateDoctor(
  doctorId: number,
  data: Partial<DoctorCreateInput>
): Promise<Doctor> {
  try {
    return await prisma.doctor.update({
      where: { doctor_id: doctorId },
      data: {
        specialization: data.specialization,
        bio: data.bio,
      },
    });
  } catch (error) {
    console.error(`Error updating doctor with ID ${doctorId}:`, error);
    throw error;
  }
}

// Get doctor by employee ID
export async function getDoctorByEmployeeId(employeeId: number) {
  try {
    return await prisma.doctor.findUnique({
      where: { employee_id: employeeId },
      include: {
        employee: {
          include: {
            user: {
              select: {
                user_id: true,
                email: true,
                first_name: true,
                last_name: true,
                phone_number: true,
                is_active: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error(
      `Error fetching doctor with employee ID ${employeeId}:`,
      error
    );
    throw error;
  }
}
