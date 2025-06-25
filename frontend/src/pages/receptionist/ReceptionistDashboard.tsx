import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import { receptionistService } from "@/services/receptionistService";
import api from "@/services/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  UserRound,
  ScrollText,
  ClipboardCheck,
  PlusCircle,
  Eye,
  FileText,
} from "lucide-react";
import { format } from "date-fns";

// Interface for appointment data
interface Appointment {
  service_id: number;
  start_time: string;
  end_time: string;
  status: string;
  patient: {
    user: {
      first_name: string;
      last_name: string;
    };
  };
  doctor: {
    employee: {
      user: {
        first_name: string;
        last_name: string;
      };
    };
  };
}

export default function ReceptionistDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [receptionistInfo, setReceptionistInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>(
    []
  );

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current receptionist info
        try {
          const receptionistResponse =
            await receptionistService.getCurrentReceptionist();
          setReceptionistInfo(receptionistResponse);
        } catch (err) {
          console.error("Error loading receptionist info:", err);
          // Don't block the whole dashboard if this fails
        }

        // Get pending service requests count
        try {
          const serviceRequestsResponse =
            await receptionistService.getServiceRequests("pending");
          setPendingRequests(serviceRequestsResponse.length || 0);
        } catch (err) {
          console.error("Error loading service requests:", err);
          // Set to 0 if we can't fetch
          setPendingRequests(0);
        }

        // Get today's appointments
        try {
          const today = format(new Date(), "yyyy-MM-dd");
          const appointmentsResponse = await api.get(
            "/services/appointments/by-date",
            {
              params: { date: today },
            }
          );
          setTodaysAppointments(appointmentsResponse.data || []);
        } catch (err) {
          console.error("Error loading today's appointments:", err);
          setTodaysAppointments([]);
        }
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

        {/* Today's Schedule Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Schedule
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">
                Loading schedule...
              </p>
            ) : (
              <div className="text-2xl font-bold">
                {todaysAppointments.length} Appointments
              </div>
            )}
            <p className="text-xs text-muted-foreground mb-3">
              Quick view of today's appointments
            </p>

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  className="w-full"
                  disabled={loading || todaysAppointments.length === 0}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Today's Schedule
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>
                    Today's Schedule - {format(new Date(), "MMMM d, yyyy")}
                  </DialogTitle>
                  <DialogDescription>
                    View all appointments scheduled for today with patient and
                    doctor details.
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto pr-4">
                  <ul className="space-y-4">
                    {todaysAppointments.length > 0 ? (
                      todaysAppointments.map((appt) => (
                        <li
                          key={appt.service_id}
                          className="p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="font-semibold text-md">
                            {format(new Date(appt.start_time), "h:mm a")} -{" "}
                            {format(new Date(appt.end_time), "h:mm a")}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Patient: {appt.patient.user.first_name}{" "}
                            {appt.patient.user.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Doctor: {appt.doctor.employee.user.first_name}{" "}
                            {appt.doctor.employee.user.last_name}
                          </p>
                          <p className="text-sm font-medium">
                            Status: {appt.status}
                          </p>
                        </li>
                      ))
                    ) : (
                      <p>No appointments scheduled for today.</p>
                    )}
                  </ul>
                </div>
              </DialogContent>
            </Dialog>
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
              <Link to="/receptionist/patients/add">
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
              <Link to="/admin/services/new">
                <Button className="w-full" variant="outline">
                  Add New Service
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
