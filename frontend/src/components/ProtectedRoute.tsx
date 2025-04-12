// frontend/src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation(); // Get current location

  if (isLoading) {
    // Show a loading indicator while checking auth status
    // Replace with a proper spinner component if desired
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect them to the /auth page, saving the current location they were
    // trying to go to in state. This allows redirecting back after login.
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Render the child route component (e.g., Dashboard, ProfilePage) if authenticated
  return <Outlet />;
};

export default ProtectedRoute;
