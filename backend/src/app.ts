// backend/src/app.ts
import express, { Request, Response, NextFunction } from "express";
import cors from "cors"; // Ensure cors is imported
import cookieParser from "cookie-parser";
import { config } from "./config/env"; // Your simplified env config

// Import routes
import authRoutes from "./routes/api/authRoutes";
import userRoutes from "./routes/api/userRoutes";
// Import other routes as needed

const app = express();

// --- CORS Configuration (Simplified) ---
const corsOptions: cors.CorsOptions = {
  // Directly use the single URL from config
  // This allows requests ONLY from this specific origin
  origin: config.frontendUrl,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // Allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  credentials: true, // IMPORTANT: Allow cookies (for the refreshToken)
};

// --- Middleware Setup ---
// Apply CORS first
app.use(cors(corsOptions));

// Then other middleware
app.use(express.json()); // Parses JSON bodies
app.use(cookieParser()); // Parses cookies (needed for refreshToken)
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded bodies if needed

// --- API Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
// ... use other routes

// --- Error Handling Middleware ---
// This should generally be placed AFTER your routes
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error("Error occurred:", err.message); // Log the error message
  // console.error(err.stack); // Log the full stack trace for debugging if needed

  // You could check for specific error types here if needed
  // e.g., if (err instanceof SpecificAppError) { ... }

  // Generic fallback
  // Note: CORS errors might not reach here if rejected earlier by the cors middleware itself
  // depending on the exact failure. The browser console is often the best place to see CORS issues.
  res.status(500).json({ message: "Internal Server Error" });
});

export default app;
