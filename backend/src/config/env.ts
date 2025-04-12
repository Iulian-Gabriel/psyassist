// backend/src/config/env.ts
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config();

// The interface for the configuration object (Simplified)
interface Config {
  port: number;
  accessTokenSecret: string;
  refreshTokenSecret: string;
  nodeEnv: string;
  frontendUrl: string; // Single URL for the frontend
}

// The configuration object that will be exported
export const config: Config = {
  port: parseInt(process.env.PORT || "8000", 10), // Default backend port
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || "",
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || "",
  nodeEnv: process.env.NODE_ENV || "development",
  // Read the single FRONTEND_URL environment variable
  // Provide a default fallback (adjust port if your frontend runs elsewhere, e.g., 5173)
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};

// Validate required environment variables
const requiredEnvVars = ["ACCESS_TOKEN_SECRET", "REFRESH_TOKEN_SECRET"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: Environment variable ${envVar} is required`);
    process.exit(1);
  }
}

// Optional: Validate that the frontend URL is set
if (!config.frontendUrl) {
  // This case should only happen if the default is removed and .env is missing the var
  console.warn(
    "Warning: FRONTEND_URL is not set in .env and no default is provided."
  );
} else {
  console.log(`Configured frontend URL for CORS: ${config.frontendUrl}`);
}
