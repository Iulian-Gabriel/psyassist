// src/scripts/initDb.ts
import prisma from "./prisma";
import bcrypt from "bcrypt";

async function initializeDatabase() {
  try {
    // Create default roles
    const adminRole = await prisma.role.upsert({
      where: { role_name: "admin" },
      update: {},
      create: {
        role_name: "admin",
        description: "System administrator",
      },
    });

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
      { name: "admin:access", description: "Can access admin features" },
      { name: "employee:read", description: "Can read employee data" },
      { name: "employee:write", description: "Can modify employee data" },
    ];

    // Create permissions and assign to appropriate roles
    for (const perm of permissions) {
      const permission = await prisma.permission.upsert({
        where: { permission_name: perm.name },
        update: {},
        create: {
          permission_name: perm.name,
          description: perm.description,
        },
      });

      // Assign permissions to admin role
      if (adminRole) {
        await prisma.rolePermissions.upsert({
          where: {
            role_id_permission_id: {
              role_id: adminRole.role_id,
              permission_id: permission.permission_id,
            },
          },
          update: {},
          create: {
            role_id: adminRole.role_id,
            permission_id: permission.permission_id,
          },
        });
      }

      // Assign relevant permissions to doctor role
      if (
        doctorRole &&
        (perm.name === "service:read" ||
          perm.name === "service:write" ||
          perm.name === "user:read")
      ) {
        await prisma.rolePermissions.upsert({
          where: {
            role_id_permission_id: {
              role_id: doctorRole.role_id,
              permission_id: permission.permission_id,
            },
          },
          update: {},
          create: {
            role_id: doctorRole.role_id,
            permission_id: permission.permission_id,
          },
        });
      }
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
