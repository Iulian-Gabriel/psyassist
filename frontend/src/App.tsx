// frontend/src/App.tsx
import React from "react"; // Ensure React is imported
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom"; // Keep hooks/components used *inside* App
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import { Button } from "./components/ui/button"; // For logout button in example

// --- Example Components (Replace with your actual pages) ---
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, logout } = useAuth();
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
                <Link to="/profile" className="mr-4 hover:text-blue-600">
                  Profile
                </Link>
                {/* Add other nav links here */}
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
      {/* Add dashboard content here */}
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
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation(); // useLocation is fine here as App is inside BrowserRouter (in main.tsx)

  // Display loading indicator while auth status is being determined
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Initializing Application...
      </div>
    );
  }

  // Logic to handle redirect after login if 'from' state exists
  // 'from' is set by ProtectedRoute when redirecting to /auth
  const from = location.state?.from?.pathname || "/dashboard";

  return (
    <Layout>
      {" "}
      {/* Wrap all routes in a common layout */}
      <Routes>
        {/* Public Routes */}
        <Route
          path="/auth"
          element={
            !isAuthenticated ? <AuthPage /> : <Navigate to={from} replace /> // Redirect logged-in users away from /auth
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
          {" "}
          {/* Outlet renders nested routes if authenticated */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* Add other protected routes here */}
          {/* e.g., <Route path="/patients" element={<PatientListPage />} /> */}
          {/* e.g., <Route path="/appointments" element={<AppointmentPage />} /> */}
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
