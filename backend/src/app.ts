// backend/src/app.ts
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config/env";

// Import routes
import authRoutes from "./routes/api/authRoutes";
import userRoutes from "./routes/api/userRoutes";
import employeeRoutes from "./routes/api/employeeRoutes";
import adminRoutes from "./routes/api/adminRoutes";
import formsRoutes from "./routes/api/formsRoutes";
import patientRoutes from "./routes/api/patientRoutes";
import serviceRoutes from "./routes/api/serviceRoutes";
import testsRoutes from "./routes/api/testsRoutes";
import notesRoutes from "./routes/api/notesRoutes";
import noticesRoutes from "./routes/api/noticesRoutes";
import feedbackRoutes from "./routes/api/feedbackRoutes";
import serviceRequestRoutes from "./routes/api/serviceRequestRoutes";
import serviceTypeRoutes from "./routes/api/serviceTypeRoutes";
import doctorRoutes from "./routes/api/doctorRoutes";
import receptionistRoutes from "./routes/api/receptionistRoutes";
import initialFormRoutes from "./routes/api/initialFormRoutes";
import dashboardRoutes from "./routes/api/dashboardRoutes";

const app = express();

// --- CORS Configuration ---
const corsOptions: cors.CorsOptions = { // Add type annotation back for clarity
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like curl, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Allow localhost:5173 for local frontend development
    if (origin.startsWith("http://localhost:5173")) {
      return callback(null, true);
    }

    // Allow any Codespaces frontend preview URL on port 5173
    // Example: https://<codespace-name>-5173.app.github.dev
    if (/^https:\/\/[\w-]+-5173\.app\.github\.dev$/.test(origin)) {
      return callback(null, true);
    }

    // Optionally allow your configured frontendUrl (e.g., for production/staging)
    if (origin === config.frontendUrl) {
      return callback(null, true);
    }

    // Otherwise, block
    callback(new Error(`Not allowed by CORS: ${origin}`)); // More informative error
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],
  credentials: true,
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
app.use("/api/employees", employeeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/forms", formsRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/tests", testsRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/notices", noticesRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/service-requests", serviceRequestRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/service-types", serviceTypeRoutes);
app.use("/api/receptionists", receptionistRoutes);
app.use("/api/initial-form", initialFormRoutes);
app.use("/api/dashboard", dashboardRoutes);

// --- Error Handling Middleware ---
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error("Error occurred:", err.message); // Log the error message
  res.status(500).json({ message: "Internal Server Error" });
});

export default app;
