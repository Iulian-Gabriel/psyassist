import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { config } from "../config/env";
import * as userService from "../services/userService";

interface LoginRequest {
  email: string;
  password: string;
}

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as LoginRequest;

  try {
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

    const userWithRoles = await userService.findByIdWithRoles(user.user_id);
    const roles = Array.isArray(userWithRoles?.roles)
      ? userWithRoles.roles.map((role) => role.role_name)
      : [];

    const accessToken = generateAccessToken(user.user_id);
    const refreshToken = generateRefreshToken(user.user_id);

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
        roles: roles,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const refreshToken = (req: Request, res: Response): void => {
  const refreshTokenFromCookie = req.cookies.refreshToken;

  if (!refreshTokenFromCookie) {
    res.status(401).json({ message: "Refresh token required" });
    return;
  }

  try {
    const payload = jwt.verify(
      refreshTokenFromCookie,
      config.refreshTokenSecret
    ) as { userId: number };

    const accessToken = generateAccessToken(payload.userId);
    res.json({ accessToken });
  } catch (error) {
    console.error("Refresh token error:", error);
    if (error instanceof jwt.TokenExpiredError) {
      res.status(403).json({ message: "Refresh token expired" });
    } else {
      res.status(403).json({ message: "Invalid refresh token" });
    }
  }
};

export const logout = (req: Request, res: Response): void => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "strict",
  });

  res.json({ message: "Logged out successfully" });
};

function generateAccessToken(userId: number): string {
  if (!config.accessTokenSecret) {
    throw new Error("Access token secret is not configured");
  }
  return jwt.sign({ userId, role: "user" }, config.accessTokenSecret, {
    expiresIn: `${config.accessTokenExpiryMinutes}m`,
  });
}

function generateRefreshToken(userId: number): string {
  if (!config.refreshTokenSecret) {
    throw new Error("Refresh token secret is not configured");
  }
  return jwt.sign({ userId }, config.refreshTokenSecret, {
    expiresIn: `${config.refreshTokenExpiryMinutes}m`,
  });
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

    if (!email || !password || !first_name || !last_name || !date_of_birth) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      res.status(409).json({ message: "Email already in use" });
      return;
    }

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

    const accessToken = generateAccessToken(newUser.user_id);
    const refreshToken = generateRefreshToken(newUser.user_id);

    const userWithRoles = await userService.findByIdWithRoles(newUser.user_id);
    const roles = Array.isArray(userWithRoles?.roles)
      ? userWithRoles.roles.map((role) => role.role_name)
      : [];

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

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
