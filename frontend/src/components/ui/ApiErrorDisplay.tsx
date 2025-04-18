import React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils"; // Import cn utility if available

interface ApiErrorDisplayProps {
  error: string | null;
  statusCode?: number;
  className?: string; // Add this line
}

const ApiErrorDisplay: React.FC<ApiErrorDisplayProps> = ({
  error,
  statusCode,
  className, // Add this line
}) => {
  if (!error) return null;

  // Map status codes to human-readable explanations
  const getStatusMessage = (code?: number) => {
    switch (code) {
      case 400:
        return "Bad Request - The server couldn't process your request due to invalid data.";
      case 401:
        return "Unauthorized - You need to be logged in to perform this action.";
      case 403:
        return "Forbidden - You don't have permission to perform this action.";
      case 404:
        return "Not Found - The requested resource doesn't exist.";
      case 409:
        return "Conflict - This record conflicts with an existing one (duplicate email, phone, etc).";
      case 422:
        return "Validation Error - Please check your input.";
      case 500:
        return "Server Error - Something went wrong on our end. Please try again later.";
      default:
        return "";
    }
  };

  const statusMessage = getStatusMessage(statusCode);

  return (
    <div
      className={cn(
        "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4",
        className
      )}
    >
      <div className="flex items-center">
        <AlertCircle className="h-5 w-5 mr-2" />
        <strong className="font-bold mr-1">Error!</strong>
        <span className="block sm:inline">{error}</span>
      </div>
      {statusCode && statusMessage && (
        <p className="text-sm mt-1 text-red-600">{statusMessage}</p>
      )}
    </div>
  );
};

export default ApiErrorDisplay;
