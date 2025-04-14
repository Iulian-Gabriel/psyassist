// src/services/userService.ts
import bcrypt from "bcrypt";
import prisma from "../utils/prisma";
import { User, Role } from "@prisma/client";

export type UserCreateInput = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  date_of_birth: Date;
  gender?: "male" | "female" | "unspecified";
  phone_number?: string;
  address_street?: string;
  address_city?: string;
  address_postal_code?: string;
  address_country?: string;
  address_county?: string;
};

export async function findByEmail(email: string): Promise<User | null> {
  try {
    return await prisma.user.findUnique({
      where: { email },
    });
  } catch (error) {
    console.error("Error finding user by email:", error);
    throw error;
  }
}

export async function findById(id: string): Promise<User | null> {
  try {
    // Ensure id is a number for database lookup
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      throw new Error("Invalid user ID format");
    }

    return await prisma.user.findUnique({
      where: { user_id: userId },
    });
  } catch (error) {
    console.error("Error finding user by ID:", error);
    throw error;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function createUser(userData: UserCreateInput): Promise<User> {
  try {
    // Hash the password before storing it
    const hashedPassword = await hashPassword(userData.password);

    // Create user with role in a transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create the user first
      const newUser = await tx.user.create({
        data: {
          email: userData.email,
          password_hash: hashedPassword,
          first_name: userData.first_name,
          last_name: userData.last_name,
          date_of_birth: userData.date_of_birth,
          gender: userData.gender || "unspecified",
          phone_number: userData.phone_number,
          address_street: userData.address_street,
          address_city: userData.address_city,
          address_postal_code: userData.address_postal_code,
          address_country: userData.address_country,
          address_county: userData.address_county,
        },
      });

      // Find the patient role
      const patientRole = await tx.role.findUnique({
        where: { role_name: "patient" },
      });

      if (!patientRole) {
        throw new Error("Patient role not found");
      }

      // Assign the patient role to the user
      await tx.userRoles.create({
        data: {
          user_id: newUser.user_id,
          role_id: patientRole.role_id,
        },
      });

      return newUser;
    });

    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

// Add a new function to get user with roles
export async function findByIdWithRoles(
  id: string
): Promise<(User & { roles?: Role[] }) | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: parseInt(id) },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) return null;

    // Transform the data to include roles directly
    return {
      ...user,
      roles: user.userRoles.map((ur) => ur.role),
    };
  } catch (error) {
    console.error("Error finding user by ID with roles:", error);
    throw error;
  }
}
