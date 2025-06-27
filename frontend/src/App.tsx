// frontend/src/App.tsx
import React from "react"; // Ensure React is imported
import {
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom"; // Add useNavigate
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import { Button } from "./components/ui/button"; // For logout button in example
import AdminDashboard from "./pages/admin/AdminDashboard";

// Add these imports after your existing imports
import AdminUsersList from "./pages/admin/AdminUsersList";
import EmployeesList from "./pages/admin/EmployeesList";
import ServicesList from "./pages/ServicesList";
import AddEmployeeForm from "./pages/admin/AddEmployeeForm";

// Add these imports at the top
import EditUserForm from "./components/forms/EditUserForm";
import EditEmployeeForm from "./components/forms/EditEmployeeForm";
import EditPatientForm from "./components/forms/EditPatientForm";

// Add this import at the top of your file with the other admin page imports
import PatientsList from "./pages/PatientsList";

// Replace these imports
import ServiceFormView from "./components/forms/ServiceFormView";
import EditPsychologicalForm from "./components/forms/EditPsychologicalForm";

// Add this import with your other page imports
import AddPatientForm from "./pages/admin/AddPatientForm";
import AddServiceForm from "./pages/admin/AddServiceForm";
import AppointmentCalendar from "./pages/receptionist/AppointmentCalendar";
import PsychologicalForms from "./components/forms/PsychologicalForms";
import ServiceFormCreator from "./components/forms/ServiceFormCreator";
import DoctorPatientTests from "./pages/doctor/PatientTests";
import AssignTest from "./pages/doctor/AssignTest";
import TestResult from "./pages/doctor/TestResult";
import PatientNotes from "./pages/doctor/PatientNotes"; // Import the new component
import NoticesList from "./pages/doctor/NoticesList";
import NoticeDetail from "./pages/doctor/NoticeDetail";
import NoticeForm from "./pages/doctor/NoticeForm";
import ProvideFeedback from "./pages/patient/ProvideFeedback";
import FeedbackList from "./pages/doctor/FeedbackList";
import ServiceRequestsList from "./pages/receptionist/ServiceRequestsList";
import PatientDetails from "./pages/receptionist/PatientDetails";
import PatientDashboard from "./pages/patient/PatientDashboard";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import ReceptionistDashboard from "./pages/receptionist/ReceptionistDashboard";
import RequestService from "./pages/patient/RequestService";
import Dashboard from "./pages/Dashboard"; // Import the redirector Dashboard
import PatientOwnTests from "./pages/patient/PatientTests.tsx";
import PatientTestResults from "./pages/patient/PatientTestResults";
import InitialAssessmentForm from "./pages/patient/InitialAssessmentForm";
import InitialAssessmentResults from "./pages/patient/InitialAssessmentResults";
import PatientNoticesList from "./pages/patient/PatientNoticesList";
import PatientServiceHistory from "./pages/patient/PatientServiceHistory"; // Import the new component

// --- Example Components (Replace with your actual pages) ---
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, logout, user } = useAuth(); // Add user to destructuring
  const isAdmin = user?.roles?.includes("admin"); // Check if user has admin role
  const navigate = useNavigate(); // Hook for navigation

  const handleLogout = () => {
    logout(); // This should clear the token and user state in your context
    // Force a navigation to the auth page to ensure a clean state.
    // The 'replace: true' option prevents the user from navigating back to the logged-in state.
    navigate("/auth", { replace: true });
  };

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
                <Button onClick={handleLogout} variant="outline" size="sm">
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

// The local Dashboard component that was here has been removed.
// The route for "/dashboard" will now use the imported redirector component.

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
          {/* Basic dashboard route - redirects based on role */}
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Role-specific dashboards */}
          <Route path="/patient" element={<PatientDashboard />} />
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/receptionist" element={<ReceptionistDashboard />} />
          {/* Patient routes */}
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route
            path="/patient/appointments/request"
            element={<RequestService />}
          />
          <Route path="/patient/my-tests" element={<PatientOwnTests />} />
          <Route
            path="/patient/tests/results/:testInstanceId"
            element={<PatientTestResults />}
          />
          <Route
            path="/patient/initial-form"
            element={<InitialAssessmentForm />}
          />
          <Route
            path="/patient/initial-form/view"
            element={<InitialAssessmentResults />}
          />
          <Route
            path="/patient/documents/notices"
            element={<PatientNoticesList />}
          />
          <Route
            path="/patient/appointments/history"
            element={
              <ProtectedRoute>
                <PatientServiceHistory /> {/* Add this route */}
              </ProtectedRoute>
            }
          />
          {/* Doctor routes */}
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route
            path="/doctor/patients"
            element={<PatientsList isDoctorView={true} />}
          />
          <Route
            path="/doctor/services"
            element={<ServicesList isDoctorView={true} />}
          />
          <Route
            path="/psychological-forms/:id"
            element={<ServiceFormView />}
          />
          <Route
            path="/psychological-forms/:id/edit"
            element={<EditPsychologicalForm />}
          />
          <Route path="/psychological-forms" element={<PsychologicalForms />} />
          <Route
            path="/psychological-forms/create"
            element={<ServiceFormCreator />}
          />
          <Route path="/patient-tests" element={<DoctorPatientTests />} />
          <Route path="/patient-tests/assign" element={<AssignTest />} />
          <Route path="/patient-tests/:id" element={<TestResult />} />
          {/* Receptionist routes */}
          <Route
            path="/receptionist/dashboard"
            element={<ReceptionistDashboard />}
          />
          <Route
            path="/receptionist/calendar"
            element={<AppointmentCalendar />}
          />
          <Route
            path="/receptionist/service-requests"
            element={<ServiceRequestsList />}
          />
          <Route
            path="/receptionist/patients"
            element={<PatientsList isReceptionistView={true} />}
          />
          <Route
            path="/receptionist/patients/add"
            element={<AddPatientForm />}
          />
          <Route
            path="/receptionist/patients/:id/view"
            element={<PatientDetails />}
          />
          <Route path="/receptionist/services" element={<ServicesList />} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* New route for patient notes */}
          <Route path="/doctor/patient-notes" element={<PatientNotes />} />{" "}
          <Route path="/doctor/notices" element={<NoticesList />} />
          <Route path="/doctor/notices/:id" element={<NoticeDetail />} />
          <Route path="/doctor/notices/create" element={<NoticeForm />} />
          <Route path="/doctor/notices/edit/:id" element={<NoticeForm />} />
          <Route path="/patient/feedback" element={<ProvideFeedback />} />
          <Route path="/patient/feedback/:id" element={<ProvideFeedback />} />
          <Route path="/doctor/feedback" element={<FeedbackList />} />
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
          <Route path="/admin/services/new" element={<AddServiceForm />} />
          <Route path="/admin/appointments" element={<AppointmentCalendar />} />
          <Route
            path="/admin/service-requests"
            element={<ServiceRequestsList />}
          />
          <Route path="/admin/feedback" element={<FeedbackList />} />
        </Route>

        {/* <Route element={<ProtectedRoute />}>
          <Route
            path="/receptionist/service-requests"
            element={<ServiceRequestsList />}
          />
        </Route> */}

        {/* Optional: Catch-all route for 404 Not Found */}
      </Routes>
    </Layout>
  );
}

// Export the App component directly
export default App;
