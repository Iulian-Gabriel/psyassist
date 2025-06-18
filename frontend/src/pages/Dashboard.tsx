import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to role-specific dashboard
    if (user?.roles?.includes("admin")) {
      navigate("/admin");
    } else if (user?.roles?.includes("doctor")) {
      navigate("/doctor");
    } else if (user?.roles?.includes("receptionist")) {
      navigate("/receptionist");
    } else if (user?.roles?.includes("patient")) {
      navigate("/patient");
    }
  }, [user, navigate]);

  // Show loading while redirecting
  return (
    <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
      <p>Redirecting to your dashboard...</p>
    </div>
  );
}
