// src/services/userService.ts
import bcrypt from "bcrypt";
import prisma from "../utils/prisma";
import { User } from "@prisma/client";

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
    return await prisma.user.findUnique({
      where: { user_id: parseInt(id) },
    });
  } catch (error) {
    console.error("Error finding user by ID:", error);
    throw error;
  }
}

export async function createUser(userData: UserCreateInput): Promise<User> {
  try {
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // Create the user
    const user = await prisma.user.create({
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

    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}
