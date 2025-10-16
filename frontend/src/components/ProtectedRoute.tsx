// frontend/src/components/ProtectedRoute.tsx
import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const isAdmin = user?.roles?.includes("admin");

  useEffect(() => {
    // If we have a user but they're trying to access wrong role's route
    if (user && !isLoading) {
      const path = location.pathname;
      const hasInvalidAccess =
        (path.startsWith("/admin") && !isAdmin) ||
        (path.startsWith("/doctor") && !user.roles?.includes("doctor")) ||
        (path.startsWith("/receptionist") && !user.roles?.includes("receptionist")) ||
        (path.startsWith("/patient") && !user.roles?.includes("patient"));

      if (hasInvalidAccess) {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, isLoading, location, navigate, isAdmin]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p>Loading...</p>
        </div>
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
