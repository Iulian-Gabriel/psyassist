import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // Add useNavigate
import { useAuth } from "@/contexts/AuthContext";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  UserRound,
  ScrollText,
  ClipboardCheck,
  PlusCircle,
  Eye,
  FileText,
} from "lucide-react";

// Create a temporary mock service until you have the actual service
const mockReceptionistService = {
  getCurrentReceptionist: async () => {
    return {
      data: {
        employeeId: 1,
        jobTitle: "Front Desk Receptionist",
      },
    };
  },
  getServiceRequests: async (status: string) => {
    return {
      data: status === "pending" ? [1, 2, 3] : [], // mock 3 pending requests
    };
  },
};

export default function ReceptionistDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate(); // Add this
  const [error, setError] = useState<string | null>(null);
  const [receptionistInfo, setReceptionistInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // Use the mock service for now
        const receptionistResponse =
          await mockReceptionistService.getCurrentReceptionist();
        setReceptionistInfo(receptionistResponse.data);

        const serviceRequestsResponse =
          await mockReceptionistService.getServiceRequests("pending");
        setPendingRequests(serviceRequestsResponse.data.length);
      } catch (err) {
        console.error("Error loading receptionist dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
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
      <h1 className="text-3xl font-bold mb-6">Receptionist Dashboard</h1>
      <p className="mb-8">
        Welcome, {user?.firstName || "User"}! Here you can manage appointments
        and patient records.
      </p>

      {receptionistInfo && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="font-medium">Job Title: {receptionistInfo.jobTitle}</p>
        </div>
      )}

      {error && <ApiErrorDisplay error={error} className="mb-6" />}

      <h2 className="text-2xl font-bold mb-4">Appointment Management</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Appointment Calendar Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Appointment Calendar
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              View and manage the appointment schedule
            </p>
            <div className="space-y-2">
              <Link to="/receptionist/calendar">
                <Button className="w-full">View Calendar</Button>
              </Link>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/receptionist/appointments/new")}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Appointment
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Service Requests Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Service Requests
            </CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Process patient appointment requests
            </p>
            {pendingRequests > 0 && (
              <div className="mb-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {pendingRequests} pending requests
                </span>
              </div>
            )}
            <div className="space-y-2">
              <Link to="/receptionist/service-requests">
                <Button className="w-full">View Service Requests</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mb-4">Patient Management</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Patient List Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Patient Records
            </CardTitle>
            <UserRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Manage patient information and records
            </p>
            <div className="space-y-2">
              <Link to="/receptionist/patients">
                <Button className="w-full">View All Patients</Button>
              </Link>
              <Link to="/receptionist/patients/new">
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
              <Link to="/receptionist/services">
                <Button className="w-full">View All Services</Button>
              </Link>
              <Link to="/receptionist/services/new">
                <Button className="w-full" variant="outline">
                  Add New Service
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Schedule
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Quick view of today's appointments
            </p>
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => navigate("/receptionist/schedule/today")}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Today's Schedule
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/receptionist/schedule/week")}
              >
                View Week Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
