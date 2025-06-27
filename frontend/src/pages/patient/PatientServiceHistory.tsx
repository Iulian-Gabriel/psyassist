// src/pages/PatientAppointmentHistory.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api"; // Use the api service like other components
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, CalendarCheck, XCircle, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

// Define the type for an appointment (matches backend response)
interface Appointment {
  service_id: number;
  service_type: string;
  start_time: string;
  end_time: string;
  status: string;
  cancel_reason: string | null;
  doctor: {
    name: string;
    specialization: string | null;
  };
  attendance_status: string;
}

export default function PatientServiceHistory() {
  const { user } = useAuth(); // Use user instead of authFetch
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Use api service like other components in your project
        const response = await api.get("/patients/appointments/history");
        setAppointments(response.data);
      } catch (err: any) {
        console.error("Error fetching appointments:", err);
        setError(
          err.response?.data?.message || "Failed to load appointment history"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user]); // Depend on user like other components

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CalendarCheck className="h-4 w-4 text-green-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <p>Loading your appointment history...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Link to="/patient/dashboard">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Appointment History</h1>
        <p className="text-muted-foreground mt-2">
          View your past and upcoming appointments
        </p>
      </div>

      {error && <ApiErrorDisplay error={error} className="mb-6" />}

      {appointments.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Appointments Found</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              You don't have any past or upcoming appointments in your history.
            </CardDescription>
            <Link to="/patient/appointments/request">
              <Button>Request a New Appointment</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Appointment History</CardTitle>
            <CardDescription>
              Here's a complete record of all your appointments with our clinic.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Cancel Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appointment) => (
                    <TableRow key={appointment.service_id}>
                      <TableCell className="font-medium">
                        {appointment.service_type}
                      </TableCell>
                      <TableCell>{appointment.doctor.name}</TableCell>
                      <TableCell>
                        {appointment.doctor.specialization || "N/A"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(appointment.start_time), "PPP")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(appointment.start_time), "p")} -{" "}
                        {format(new Date(appointment.end_time), "p")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(appointment.status)}
                          <span className="capitalize">
                            {appointment.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">
                          {appointment.attendance_status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {appointment.cancel_reason || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
