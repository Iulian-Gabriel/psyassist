import prisma from "../utils/prisma";
import { Employee, User } from "@prisma/client";
import * as userService from "./userService";
import * as employeeService from "./employeeService";

export type ReceptionistCreateInput = {
  employee_id: number;
};

// Create a receptionist (requires an existing employee)
export async function createReceptionist(
  data: ReceptionistCreateInput
): Promise<Employee> {
  try {
    return await prisma.employee.update({
      where: { employee_id: data.employee_id },
      data: {},
    });
  } catch (error) {
    console.error("Error creating receptionist:", error);
    throw error;
  }
}

// Create a receptionist with associated user and employee records in a transaction
export async function createReceptionistWithUserAndEmployee(
  userData: userService.UserCreateInput,
  employeeData: Omit<employeeService.EmployeeCreateInput, "user_id">
): Promise<{ user: User; employee: Employee }> {
  try {
    const result = await employeeService.createEmployeeWithRole(
      userData,
      employeeData,
      "receptionist"
    );

    return {
      user: result.user,
      employee: result.employee,
    };
  } catch (error) {
    console.error("Error creating receptionist:", error);
    throw error;
  }
}

// Get all receptionists with their employee and user info
export async function getAllReceptionists() {
  try {
    // Find all employees with receptionist role
    return await prisma.employee.findMany({
      where: {
        user: {
          userRoles: {
            some: {
              role: {
                role_name: "receptionist",
              },
            },
          },
        },
      },
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
    });
  } catch (error) {
    console.error("Error fetching receptionists:", error);
    throw error;
  }
}

// Get receptionist by ID
export async function getReceptionistById(employeeId: number) {
  try {
    return await prisma.employee.findFirst({
      where: {
        employee_id: employeeId,
        user: {
          userRoles: {
            some: {
              role: {
                role_name: "receptionist",
              },
            },
          },
        },
      },
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
    });
  } catch (error) {
    console.error(`Error fetching receptionist with ID ${employeeId}:`, error);
    throw error;
  }
}
