import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { config } from "../config/env";

// Extend Express Request type to include userId
export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ message: "Access token required" });
    return;
  }

  try {
    if (!config.accessTokenSecret) {
      throw new Error("ACCESS_TOKEN_SECRET is not defined");
    }

    const payload = jwt.verify(token, config.accessTokenSecret) as unknown as {
      userId: string;
    };

    req.userId = payload.userId;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ message: "Invalid access token" });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(403).json({ message: "Access token expired" });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

//Whenever i login, i can get a token that i can keep using until it expires, even if i refresh it.
