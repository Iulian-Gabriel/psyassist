import { Request, Response, NextFunction } from "express";

interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Log error details for debugging
  console.error(`[ERROR] ${statusCode} - ${message}`);
  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  // Send appropriate error response
  res.status(statusCode).json({
    success: false,
    message,
    // Include stack trace in development mode
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}
