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
import TakeTest from "./pages/patient/TakeTest";
import PatientDetailsPage from "./pages/doctor/PatientDetailsPage.tsx";
import PatientInitialAssessmentResults from "./pages/doctor/PatientnitialAssessmentResults.tsx";
import UpcomingAppointments from "./pages/patient/UpcomingAppointments";
import AllCompletedTests from "./pages/admin/AllCompletedTests";
import {
  Heart,
  Shield,
  Users,
  Calendar,
  MessageCircle,
  Star,
} from "lucide-react";

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
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
    {/* Hero Section */}
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg">
              <Heart className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PsyAssist
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Your comprehensive mental wellness companion. Professional
            psychological support, assessments, and care management all in one
            secure platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button
                size="lg"
                className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                Get Started Today
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-4 text-lg border-2 hover:bg-gray-50"
              onClick={() =>
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>

    {/* Features Section */}
    <div id="features" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Comprehensive Mental Health Care
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need for professional psychological support and
            wellness management
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-6">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Easy Appointment Scheduling
            </h3>
            <p className="text-gray-600">
              Book consultations with qualified psychologists at your
              convenience. Flexible scheduling that works with your lifestyle.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-6">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Secure & Confidential
            </h3>
            <p className="text-gray-600">
              Your privacy is our priority. All sessions and records are
              protected with enterprise-grade security and full GDPR compliance.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-6">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Professional Care Team
            </h3>
            <p className="text-gray-600">
              Work with licensed psychologists, therapists, and support staff
              dedicated to your mental health journey.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-6">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Psychological Assessments
            </h3>
            <p className="text-gray-600">
              Comprehensive psychological testing and assessments to better
              understand your mental health and develop personalized treatment
              plans.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center mb-6">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Wellness Tracking
            </h3>
            <p className="text-gray-600">
              Monitor your progress with built-in wellness tracking tools and
              receive insights about your mental health journey.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-pink-500 rounded-lg flex items-center justify-center mb-6">
              <Star className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              24/7 Support Access
            </h3>
            <p className="text-gray-600">
              Access your care team and resources whenever you need them. Mental
              health support shouldn't wait for business hours.
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Stats Section */}
    <div className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            Trusted by Thousands
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">500+</div>
              <div className="text-lg opacity-90">Happy Patients</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">50+</div>
              <div className="text-lg opacity-90">Licensed Professionals</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">98%</div>
              <div className="text-lg opacity-90">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* CTA Section */}
    <div className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          Ready to Start Your Wellness Journey?
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Join thousands of individuals who have taken control of their mental
          health with PsyAssist. Your wellbeing is worth investing in.
        </p>
        <Link to="/auth">
          <Button
            size="lg"
            className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          >
            Get Started - It's Free
          </Button>
        </Link>
        <p className="text-sm text-gray-500 mt-4">
          No credit card required • Secure & confidential • HIPAA compliant
        </p>
      </div>
    </div>

    {/* Footer */}
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <Heart className="w-6 h-6 mr-2" />
              <span className="text-xl font-bold">PsyAssist</span>
            </div>
            <p className="text-gray-400">
              Professional mental health care and wellness management platform.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Individual Consultations</li>
              <li>Group Therapy</li>
              <li>Psychological Assessments</li>
              <li>Wellness Tracking</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Help Center</li>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
              <li>Contact Us</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 PsyAssist. All rights reserved.</p>
        </div>
      </div>
    </footer>
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
          <Route
            path="/patient/tests/take/:testInstanceId"
            element={<TakeTest />}
          />
          <Route
            path="/patient/tests/results/:testInstanceId"
            element={<PatientTestResults />}
          />
          <Route
            path="/patient/appointments/upcoming"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <UpcomingAppointments />
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
          <Route path="/doctor/patients/:id" element={<PatientDetailsPage />} />
          <Route
            path="/doctor/patients/:id/initial-assessment"
            element={<PatientInitialAssessmentResults />}
          />
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
          <Route
            path="/receptionist/patients/:id/edit"
            element={<EditPatientForm isReceptionistView={true} />}
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
          <Route
            path="/admin/tests/completed"
            element={<AllCompletedTests />}
          />
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
