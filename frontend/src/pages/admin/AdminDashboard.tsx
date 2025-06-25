import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchAdminStats } from "@/services/adminService";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import {
  Users,
  UserCog,
  Activity,
  ClipboardList,
  MessageSquare,
  FileText,
  Calendar,
  UserRound,
  ScrollText,
  Clipboard,
  FileQuestion,
  Files,
  Eye,
  PlusCircle,
} from "lucide-react";

// First, let's create a helper component for not-implemented cards
const NotImplementedCard = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <Card className={`bg-red-50 border-red-100 ${className}`}>{children}</Card>
  );
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("admin");
  const navigate = useNavigate();

  const [stats, setStats] = useState<{
    totalUsers: number;
    totalDoctors: number;
    totalPatients: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorStatusCode, setErrorStatusCode] = useState<number | undefined>(
    undefined
  );

  useEffect(() => {
    const getStats = async () => {
      try {
        setLoading(true);
        const data = await fetchAdminStats();
        console.log("Admin stats data:", data);
        setStats(data.stats);
        setError(null);
      } catch (err: unknown) {
        console.error("Failed to fetch admin stats:", err);

        let errorMessage = "Failed to load dashboard data.";
        let statusCode: number | undefined = undefined;

        if (err && typeof err === "object") {
          if ("response" in err) {
            const response = (
              err as {
                response: { status?: number; data?: { message?: string } };
              }
            ).response;
            statusCode = response?.status;
            errorMessage = response?.data?.message || errorMessage;
          } else if ("message" in err) {
            errorMessage = (err as Error).message;
          }
        }

        setError(errorMessage);
        setErrorStatusCode(statusCode);
      } finally {
        setLoading(false);
      }
    };

    getStats();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {error && <ApiErrorDisplay error={error} statusCode={errorStatusCode} />}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Registered accounts in the system
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Doctors</CardTitle>
              <UserCog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDoctors}</div>
              <p className="text-xs text-muted-foreground">
                Medical staff available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Patients</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPatients}</div>
              <p className="text-xs text-muted-foreground">
                Registered patients
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Doctor Module Section */}
      <h2 className="text-2xl font-bold mb-4">Doctor Functions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Assessment Forms Card - Implemented */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Assessment Forms
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Manage psychological assessment forms
            </p>
            <div className="space-y-2">
              <Link to="/psychological-forms">
                <Button className="w-full">View All Forms</Button>
              </Link>
              <Link to="/psychological-forms/create">
                <Button className="w-full" variant="outline">
                  Create New Form
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Patient Tests Card - Not Implemented */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Patient Tests</CardTitle>
            <ScrollText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Manage psychological tests for patients
            </p>
            <div className="space-y-2">
              <Link to="/patient-tests">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Patient Tests
                </Button>
              </Link>
              <Link to="/patient-tests/assign">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Assign New Test
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Patient Notes Card - Implemented */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Patient Notes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Patient Notes</div>
            <p className="text-xs text-muted-foreground mt-1">
              Create and manage notes for patient appointments
            </p>
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => navigate("/doctor/patient-notes")}
              >
                View Patient Notes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Medical Notices Card - Implemented */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Medical Notices
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Medical Notices</div>
            <p className="text-xs text-muted-foreground">
              Create and manage psychological notices for patients
            </p>
            <div className="mt-4">
              <Button
                onClick={() => navigate("/doctor/notices")}
                className="w-full"
              >
                Manage Notices
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Patient Feedback Card - Implemented */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Patient Feedback
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              View feedback from patients
            </p>
            <div className="space-y-2">
              <Link to="/admin/feedback">
                <Button className="w-full">View All Feedback</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receptionist Section - These are implemented based on your file structure */}
      <h2 className="text-2xl font-bold mb-4">Receptionist Functions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Appointment Calendar Card - Implemented */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Appointment Scheduling
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              View and manage patient appointments
            </p>
            <div className="space-y-2">
              <Link to="/admin/appointments">
                <Button className="w-full">Appointment Calendar</Button>
              </Link>
              <Link to="/admin/service-requests">
                <Button className="w-full" variant="outline">
                  View Service Requests
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Patient Management Card - Implemented */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Patient Management
            </CardTitle>
            <UserRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Manage patients and their records
            </p>
            <div className="space-y-2">
              <Link to="/admin/patients">
                <Button className="w-full">View All Patients</Button>
              </Link>
              <Link to="/admin/add-patient">
                <Button className="w-full" variant="outline">
                  Register New Patient
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Services Management Card - Implemented */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Services</CardTitle>
            <ScrollText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Manage consultations and group services
            </p>
            <div className="space-y-2">
              <Link to="/admin/services">
                <Button className="w-full">View All Services</Button>
              </Link>
              <Link to="/admin/services/new">
                <Button className="w-full" variant="outline">
                  Add New Service
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Section - Both are implemented */}
      <h2 className="text-2xl font-bold mb-4">Administration</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Users Management Card - Implemented */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Users Management
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Manage users and their roles
            </p>
            <div className="space-y-2">
              <Link to="/admin/users">
                <Button className="w-full">View All Users</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Employee Management Card - Implemented */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Employee Management
            </CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Manage doctors and staff
            </p>
            <div className="space-y-2">
              <Link to="/admin/employees">
                <Button className="w-full">View All Employees</Button>
              </Link>
              <Link to="/admin/employees/new">
                <Button className="w-full" variant="outline">
                  Add New Employee
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient Functions Section - All Not Implemented except Request Appointment */}
      <h2 className="text-2xl font-bold mb-4">Patient Functions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Psychological Tests Card - Not Implemented */}
        <NotImplementedCard>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Psychological Tests
            </CardTitle>
            <FileQuestion className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Complete psychological tests assigned by your doctor
            </p>
            <div className="space-y-2">
              <Link to="/patient/tests/assigned">
                <Button className="w-full">Pending Tests</Button>
              </Link>
              <Link to="/patient/tests/completed">
                <Button className="w-full" variant="outline">
                  Completed Tests
                </Button>
              </Link>
            </div>
          </CardContent>
        </NotImplementedCard>

        {/* Initial Assessment Card - Not Implemented */}
        <NotImplementedCard>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Initial Assessment
            </CardTitle>
            <Clipboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Complete your initial assessment form
            </p>
            <div className="space-y-2">
              <Link to="/patient/initial-form">
                <Button className="w-full">Initial Assessment Form</Button>
              </Link>
              <Link to="/patient/initial-form/view">
                <Button className="w-full" variant="outline">
                  View Your Responses
                </Button>
              </Link>
            </div>
          </CardContent>
        </NotImplementedCard>

        {/* Feedback Card - Not Implemented */}
        <Card>
          <CardHeader>
            <CardTitle>Provide Feedback</CardTitle>
            <CardDescription>
              Rate services and submit feedback to doctors
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <div className="space-y-1">
              <p>Submit feedback for psychological services</p>
              <p className="text-sm text-muted-foreground">
                Help us improve with your input
              </p>
            </div>
            <Button onClick={() => navigate("/patient/feedback")}>
              Rate Services
            </Button>
          </CardContent>
        </Card>

        {/* My Documents Card - Not Implemented */}
        <NotImplementedCard>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Documents</CardTitle>
            <Files className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Access your medical documents and notices
            </p>
            <div className="space-y-2">
              <Link to="/patient/documents/tests">
                <Button className="w-full">Test Results</Button>
              </Link>
              <Link to="/patient/documents/notices">
                <Button className="w-full" variant="outline">
                  Doctor Notices
                </Button>
              </Link>
              <Link to="/patient/documents/forms">
                <Button className="w-full" variant="outline">
                  Completed Forms
                </Button>
              </Link>
            </div>
          </CardContent>
        </NotImplementedCard>

        {/* Appointment Requests Card - Implemented */}

        <NotImplementedCard>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Appointment Requests
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Request and manage your appointments
            </p>
            <div className="space-y-2">
              <Link to="/patient/appointments/request">
                <Button className="w-full">Request Appointment</Button>
              </Link>
              <Link to="/patient/appointments/history">
                <Button className="w-full" variant="outline">
                  Appointment History
                </Button>
              </Link>
              <Link to="/patient/appointments/upcoming">
                <Button className="w-full" variant="outline">
                  Upcoming Appointments
                </Button>
              </Link>
            </div>
          </CardContent>
        </NotImplementedCard>
      </div>
    </div>
  );
}
