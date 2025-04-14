import prisma from "../utils/prisma";
import * as employeeService from "../services/employeeService";
import { config } from "../config/env";

async function createInitialAdmin() {
  try {
    // Check if an admin already exists
    const adminRole = await prisma.role.findUnique({
      where: { role_name: "admin" },
    });

    if (!adminRole) {
      console.error("Admin role not found. Run initDb.ts first.");
      process.exit(1);
    }

    // Check if any users with admin role already exist
    const existingAdmins = await prisma.userRoles.findFirst({
      where: { role_id: adminRole.role_id },
    });

    if (existingAdmins) {
      console.log(
        "Admin users already exist. No need to create initial admin."
      );
      return;
    }

    // Create initial admin account
    await employeeService.createEmployeeWithRole(
      {
        email: "admin@psyassist.com",
        password: "Admin123!", // This should be changed immediately after first login
        first_name: "System",
        last_name: "Administrator",
        date_of_birth: new Date(1980, 0, 1), // January 1, 1980
        gender: "unspecified",
        phone_number: "+00000000000",
      },
      {
        job_title: "System Administrator",
        hire_date: new Date(),
      },
      "admin"
    );

    console.log("Initial admin account created successfully");
    console.log("Email: admin@psyassist.com");
    console.log("Password: Admin123!");
    console.log("IMPORTANT: Please change this password after first login!");
  } catch (error) {
    console.error("Error creating initial admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createInitialAdmin();
