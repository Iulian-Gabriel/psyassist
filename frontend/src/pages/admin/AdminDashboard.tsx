import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAdminStats } from "@/services/adminService";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import {
  Users,
  UserCog,
  Activity,
  MessageSquare,
  Calendar,
  UserRound,
  ScrollText,
} from "lucide-react";

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

      {/* All Management Cards in a single 3-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Patient Feedback Card */}
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

        {/* Appointment Scheduling Card */}
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

        {/* Patient Management Card */}
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

        {/* Services Management Card */}
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

        {/* Completed Tests Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Tests
            </CardTitle>
            <ScrollText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              View completed psychological tests from all patients
            </p>
            <div className="space-y-2">
              <Link to="/admin/tests/completed">
                <Button className="w-full">View All Tests</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Users Management Card */}
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

        {/* Employee Management Card */}
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
    </div>
  );
}
