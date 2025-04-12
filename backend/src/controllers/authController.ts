import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { config } from "../config/env";
import * as userService from "../services/userService";
import { User } from "@prisma/client";

// This interface defines the structure of the login request body
interface LoginRequest {
  email: string;
  password: string;
}

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as LoginRequest;

  try {
    // Find user with roles
    const user = await userService.findByEmail(email);
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Get user with roles
    const userWithRoles = await userService.findByIdWithRoles(
      user.user_id.toString()
    );
    const roles = Array.isArray(userWithRoles?.roles)
      ? userWithRoles.roles.map((role) => role.role_name)
      : [];

    // Generate tokens
    const accessToken = generateAccessToken(user.user_id.toString());
    const refreshToken = generateRefreshToken(user.user_id.toString());

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,
      user: {
        id: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        roles: roles, // Include roles in response
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const refreshToken = (req: Request, res: Response): void => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    res.status(401).json({ message: "Refresh token required" });
    return;
  }

  try {
    // Verify refresh token
    const payload = jwt.verify(
      refreshToken,
      config.refreshTokenSecret
    ) as unknown as {
      // unknown means we don't know the type of the payload yet
      userId: string; // userId is the property we expect in the payload
    };

    // Generate new access token
    const accessToken = generateAccessToken(payload.userId);

    res.json({ accessToken });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(403).json({ message: "Refresh token expired" });
    } else {
      res.status(403).json({ message: "Invalid refresh token" });
    }
  }
};

export const logout = (req: Request, res: Response): void => {
  // Clear the refresh token cookie
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "strict",
  });

  res.json({ message: "Logged out successfully" });
};

// Helper functions
function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, config.accessTokenSecret, { expiresIn: "15m" });
}

function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, config.refreshTokenSecret, { expiresIn: "7d" });
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
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
    } = req.body;

    // Validate required fields
    if (!email || !password || !first_name || !last_name || !date_of_birth) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Check if user already exists
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      res.status(409).json({ message: "Email already in use" });
      return;
    }

    // Create new user
    const newUser = await userService.createUser({
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
    });

    // Generate tokens for automatic login
    const accessToken = generateAccessToken(newUser.user_id.toString());
    const refreshToken = generateRefreshToken(newUser.user_id.toString());

    // Get user with roles after creation
    const userWithRoles = await userService.findByIdWithRoles(
      newUser.user_id.toString()
    );
    const roles = Array.isArray(userWithRoles?.roles)
      ? userWithRoles.roles.map((role) => role.role_name)
      : [];

    // Send refresh token as HttpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user data with roles and access token
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.user_id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        roles: roles,
      },
      accessToken,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};
