// frontend/src/App.tsx
import React from "react"; // Ensure React is imported
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom"; // Keep hooks/components used *inside* App
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import { Button } from "./components/ui/button"; // For logout button in example
import AdminDashboard from "./pages/admin/AdminDashboard";

// Add these imports after your existing imports
import AdminUsersList from "./pages/admin/AdminUsersList";
import EmployeesList from "./pages/admin/EmployeesList";
import ServicesList from "./pages/admin/ServicesList";
import AddEmployeeForm from "./pages/admin/AddEmployeeForm";

// Add these imports at the top
import EditUserForm from "./components/forms/EditUserForm";
import EditEmployeeForm from "./components/forms/EditEmployeeForm";
import EditPatientForm from "./components/forms/EditPatientForm";

// Add this import at the top of your file with the other admin page imports
import PatientsList from "./pages/admin/PatientsList";

// Replace these imports
import PsychologicalForms from "./components/forms/PsychologicalForms";
import ServiceFormCreator from "./components/forms/ServiceFormCreator";
import ServiceFormView from "./components/forms/ServiceFormView";
import EditPsychologicalForm from "./components/forms/EditPsychologicalForm";

// Add this import with your other page imports
import AddPatientForm from "./pages/admin/AddPatientForm";

// --- Example Components (Replace with your actual pages) ---
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, logout, user } = useAuth(); // Add user to destructuring
  const isAdmin = user?.roles?.includes("admin"); // Check if user has admin role

  return (
    <div>
      <nav className="bg-gray-100 dark:bg-gray-800 p-4 shadow">
        <div className="container mx-auto flex justify-between items-center">
          <Link
            to={isAuthenticated ? "/dashboard" : "/"}
            className="text-xl font-bold"
          >
            PsyAssist
          </Link>
          <div>
            {isAuthenticated && (
              <>
                <Link to="/dashboard" className="mr-4 hover:text-blue-600">
                  Dashboard
                </Link>
                {/* Add conditional admin link here */}
                {isAdmin && (
                  <Link to="/admin" className="mr-4 hover:text-blue-600">
                    Admin
                  </Link>
                )}
                <Link to="/profile" className="mr-4 hover:text-blue-600">
                  Profile
                </Link>
                <Button onClick={logout} variant="outline" size="sm">
                  Logout
                </Button>
              </>
            )}
            {!isAuthenticated && (
              <Link to="/auth">
                <Button variant="default" size="sm">
                  Login / Sign Up
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>
      <main className="container mx-auto p-4">{children}</main>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("admin");
  const isDoctor = user?.roles?.includes("doctor");

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p>
        Welcome back, {user?.firstName || "User"}
        {(user?.roles?.length ?? 0) > 0 && (
          <span className="ml-1">
            , you are {user?.roles?.length === 1 ? "a" : ""}{" "}
            <span className="font-semibold">{user?.roles?.join(", ")}</span>
          </span>
        )}
        !
      </p>

      {isAdmin && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Admin Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/admin" className="btn btn-primary">
              Admin Dashboard
            </Link>
            <Link to="/admin/users" className="btn btn-secondary">
              Manage Users
            </Link>
            <Link to="/admin/employees" className="btn btn-secondary">
              Manage Staff
            </Link>
          </div>
        </div>
      )}

      {isDoctor && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Doctor Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/services" className="btn btn-primary">
              My Services
            </Link>
            <Link to="/patients" className="btn btn-secondary">
              My Patients
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

const PublicHomePage = () => (
  <div>
    <h1 className="text-3xl font-bold mb-4">Welcome to PsyAssist</h1>
    <p>Your mental wellness companion.</p>
    <Link to="/auth" className="mt-4 inline-block">
      <Button>Get Started</Button>
    </Link>
  </div>
);
// --- End Example Components ---

// App component remains largely the same internally
function App() {
  const { isAuthenticated, isLoading, user } = useAuth(); // Add user to the destructured values
  const location = useLocation();

  // Display loading indicator while auth status is being determined
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Initializing Application...
      </div>
    );
  }

  // Logic to handle redirect after login if 'from' state exists
  // with role-based permission check
  const from = location.state?.from?.pathname || "/dashboard";

  // Check if the user has permission for the requested route
  const isAdmin = user?.roles?.includes("admin");
  const hasRoutePermission = !from.startsWith("/admin") || isAdmin;

  // If no permission, default to dashboard
  const redirectTo = hasRoutePermission ? from : "/dashboard";

  return (
    <Layout>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/auth"
          element={
            !isAuthenticated ? (
              <AuthPage />
            ) : (
              <Navigate to={redirectTo} replace />
            )
          }
        />
        <Route
          path="/"
          element={
            !isAuthenticated ? (
              <PublicHomePage />
            ) : (
              <Navigate to="/dashboard" replace /> // Redirect logged-in users from / to /dashboard
            )
          }
        />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* Other regular protected routes */}
        </Route>

        {/* Admin routes with requiresAdmin prop */}
        <Route element={<ProtectedRoute requiresAdmin={true} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsersList />} />
          <Route path="/admin/users/:id/edit" element={<EditUserForm />} />
          <Route path="/admin/employees" element={<EmployeesList />} />
          <Route
            path="/admin/employees/:id/edit"
            element={<EditEmployeeForm />}
          />
          <Route path="/admin/employees/new" element={<AddEmployeeForm />} />
          <Route path="/admin/patients" element={<PatientsList />} />
          <Route
            path="/admin/patients/:id/edit"
            element={<EditPatientForm />}
          />
          <Route path="/admin/services" element={<ServicesList />} />
          <Route path="/admin/add-employee" element={<AddEmployeeForm />} />
          <Route path="/admin/add-patient" element={<AddPatientForm />} />
        </Route>

        {/* Psychological Forms Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/psychological-forms" element={<PsychologicalForms />} />
          <Route
            path="/psychological-forms/create"
            element={<ServiceFormCreator />}
          />
          <Route
            path="/psychological-forms/:id"
            element={<ServiceFormView />}
          />
          <Route
            path="/psychological-forms/:id/edit"
            element={
              <ProtectedRoute>
                <EditPsychologicalForm />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Optional: Catch-all route for 404 Not Found */}
        <Route
          path="*"
          element={
            <div>
              <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
              <Link to={isAuthenticated ? "/dashboard" : "/"}>
                <Button variant="link">Go Home</Button>
              </Link>
            </div>
          }
        />
      </Routes>
    </Layout>
  );
}

// Export the App component directly
export default App;
