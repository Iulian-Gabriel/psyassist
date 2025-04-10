import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config();

// The interface for the configuration object
// This defines the structure of the configuration object
interface Config {
  port: number;
  accessTokenSecret: string;
  refreshTokenSecret: string;
  nodeEnv: string;
  frontendUrl: string;
}

// The configuration object that will be exported
// This object contains the configuration values for the application
export const config: Config = {
  port: parseInt(process.env.PORT || "4000", 10),
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || "",
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || "",
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
};

// Validate required environment variables
// This checks if the required environment variables are set
// If any of them are missing, it logs an error message and exits the process
// This is important to ensure that the application has all the necessary configuration to run properly
// The required environment variables are defined in an array
const requiredEnvVars = ["ACCESS_TOKEN_SECRET", "REFRESH_TOKEN_SECRET"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: Environment variable ${envVar} is required`);
    process.exit(1);
  }
}
