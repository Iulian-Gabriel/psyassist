// src/scripts/initDb.ts
import prisma from "./prisma";
import bcrypt from "bcrypt";

async function initializeDatabase() {
  try {
    // Create default roles

    const doctorRole = await prisma.role.upsert({
      where: { role_name: "doctor" },
      update: {},
      create: {
        role_name: "doctor",
        description: "Medical professional",
      },
    });

    const patientRole = await prisma.role.upsert({
      where: { role_name: "patient" },
      update: {},
      create: {
        role_name: "patient",
        description: "Patient user",
      },
    });

    // Create default permissions
    const permissions = [
      { name: "user:read", description: "Can read user data" },
      { name: "user:write", description: "Can modify user data" },
      { name: "service:read", description: "Can read service data" },
      { name: "service:write", description: "Can modify service data" },
    ];

    for (const perm of permissions) {
      await prisma.permission.upsert({
        where: { permission_name: perm.name },
        update: {},
        create: {
          permission_name: perm.name,
          description: perm.description,
        },
      });
    }

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
initializeDatabase();
