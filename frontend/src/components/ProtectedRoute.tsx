// frontend/src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  requiresAdmin?: boolean;
  children?: React.ReactNode; // Add this line to support children
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiresAdmin = false,
  children,
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

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Additional check for admin routes
  if (requiresAdmin && !isAdmin) {
    return (
      <Navigate
        to="/dashboard"
        state={{ message: "Access denied: Admin permissions required" }}
        replace
      />
    );
  }

  // Return either children or Outlet (for nested routes)
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
