// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Create a singleton instance of PrismaClient
const prisma = new PrismaClient();

// Handle potential connection errors
prisma
  .$connect()
  .then(() => {
    console.log("Successfully connected to database");
  })
  .catch((error) => {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  });

export default prisma;
