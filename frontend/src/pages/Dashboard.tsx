import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait until authentication status is determined
    if (isLoading) {
      return;
    }

    if (!user || !user.roles || user.roles.length === 0) {
      navigate("/auth", { replace: true });
      return;
    }

    // Use a small timeout to ensure state is fully cleared
    const timeoutId = setTimeout(() => {
      // Redirect to role-specific dashboard
      if (user.roles.includes("admin")) {
        navigate("/admin", { replace: true });
      } else if (user.roles.includes("doctor")) {
        navigate("/doctor", { replace: true });
      } else if (user.roles.includes("receptionist")) {
        navigate("/receptionist", { replace: true });
      } else if (user.roles.includes("patient")) {
        navigate("/patient", { replace: true });
      } else {
        console.warn("User has no matching role for redirection.", user.roles);
        navigate("/auth", { replace: true });
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [user, isLoading, navigate]);

  return (
    <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p>Loading your dashboard...</p>
      </div>
    </div>
  );
}
