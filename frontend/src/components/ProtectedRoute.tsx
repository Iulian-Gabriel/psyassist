// frontend/src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute: React.FC<{ requiresAdmin?: boolean }> = ({
  requiresAdmin = false,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.roles?.includes("admin");

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check for admin-only routes
  if (requiresAdmin && !isAdmin) {
    return (
      <Navigate
        to="/dashboard"
        state={{ message: "Access denied: Admin permissions required" }}
        replace
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
