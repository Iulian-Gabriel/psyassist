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

    // Log the user object to the browser console to inspect its structure
    console.log("User object for redirection:", user);

    if (user?.roles) {
      // Redirect to role-specific dashboard
      if (user.roles.includes("admin")) {
        navigate("/admin");
      } else if (user.roles.includes("doctor")) {
        navigate("/doctor");
      } else if (user.roles.includes("receptionist")) {
        navigate("/receptionist");
      } else if (user.roles.includes("patient")) {
        navigate("/patient");
      } else {
        // This case handles users that are logged in but have no redirectable role.
        console.warn("User has no matching role for redirection.", user.roles);
      }
    } else if (!user) {
      // If there's no user after loading, redirect to the login page.
      // You might need to adjust the path to "/login" or your auth page.
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  // Show a more accurate loading message
  return (
    <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
      <p>Loading your dashboard...</p>
    </div>
  );
}
