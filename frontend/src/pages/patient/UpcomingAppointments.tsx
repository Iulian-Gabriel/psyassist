import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import api from "@/services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import {
  Calendar,
  Clock,
  User,
  ArrowLeft,
  MapPin,
  Phone,
  X,
} from "lucide-react";
import { toast } from "sonner"; // Make sure you have sonner installed, or use your preferred toast library

interface UpcomingAppointment {
  service_id: number;
  service_type: string;
  start_time: string;
  end_time: string;
  status: string;
  doctor: {
    name: string;
    specialization: string | null;
  };
  attendance_status: string;
}

export default function UpcomingAppointments() {
  const [appointments, setAppointments] = useState<UpcomingAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<UpcomingAppointment | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    const fetchUpcomingAppointments = async () => {
      try {
        setLoading(true);
        const response = await api.get("/patients/appointments/upcoming");
        setAppointments(response.data);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch upcoming appointments:", err);
        setError(
          "Failed to load upcoming appointments. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingAppointments();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatAppointmentTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);

    return {
      date: format(start, "EEEE, MMMM do, yyyy"),
      time: `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`,
      dayOfWeek: format(start, "EEEE"),
      shortDate: format(start, "MMM do"),
    };
  };

  const canCancelAppointment = (appointment: UpcomingAppointment): boolean => {
    // Can only cancel scheduled appointments
    if (appointment.status.toLowerCase() !== "scheduled") {
      console.log(
        `Cannot cancel appointment ${appointment.service_id}: status is ${appointment.status}`
      );
      return false;
    }

    // Check if appointment is in the future and more than 24 hours away
    const appointmentTime = new Date(appointment.start_time);
    const now = new Date();
    const timeDiff = appointmentTime.getTime() - now.getTime();
    const hoursUntilAppointment = timeDiff / (1000 * 3600);

    // console.log(`Appointment ${appointment.service_id}:`, {
    //   appointmentTime: appointmentTime.toISOString(),
    //   now: now.toISOString(),
    //   hoursUntilAppointment,
    //   canCancel: hoursUntilAppointment > 24,
    // });

    return hoursUntilAppointment > 24;
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      setCancelLoading(true);

      await api.patch(
        `/patients/appointments/${selectedAppointment.service_id}/cancel`,
        {
          cancellation_reason: cancellationReason || "Cancelled by patient",
        }
      );

      // Update the local state to reflect the cancellation
      setAppointments((prevAppts) =>
        prevAppts.map((apt) =>
          apt.service_id === selectedAppointment.service_id
            ? { ...apt, status: "Cancelled" }
            : apt
        )
      );

      // Show success message
      toast.success("Appointment cancelled successfully");

      // Close dialog and reset state
      setShowCancelDialog(false);
      setSelectedAppointment(null);
      setCancellationReason("");
    } catch (err: any) {
      console.error("Failed to cancel appointment:", err);

      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error(
          "Failed to cancel appointment. Please try again or contact the office."
        );
      }
    } finally {
      setCancelLoading(false);
    }
  };

  const openCancelDialog = (appointment: UpcomingAppointment) => {
    setSelectedAppointment(appointment);
    setShowCancelDialog(true);
    setCancellationReason("");
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center min-h-[60vh]">
          <p>Loading upcoming appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Upcoming Appointments</h1>
          <p className="text-muted-foreground mt-1">
            View your scheduled appointments
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/patient/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {error && <ApiErrorDisplay error={error} className="mb-6" />}

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No Upcoming Appointments
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              You don't have any scheduled appointments at the moment.
            </p>
            <Button asChild>
              <Link to="/patient/appointments/request">
                Request New Appointment
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment) => {
            const timeInfo = formatAppointmentTime(
              appointment.start_time,
              appointment.end_time
            );
            const canCancel = canCancelAppointment(appointment);

            return (
              <Card
                key={appointment.service_id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl flex items-center">
                        <Calendar className="mr-2 h-5 w-5 text-blue-600" />
                        {appointment.service_type.replace("_", " ")}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Appointment #{appointment.service_id}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Date and Time */}
                    <div className="space-y-2">
                      <div className="flex items-center text-sm font-medium">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        Date & Time
                      </div>
                      <div className="pl-6">
                        <p className="font-medium">{timeInfo.date}</p>
                        <p className="text-sm text-muted-foreground">
                          {timeInfo.time}
                        </p>
                      </div>
                    </div>

                    {/* Doctor Information */}
                    <div className="space-y-2">
                      <div className="flex items-center text-sm font-medium">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        Doctor
                      </div>
                      <div className="pl-6">
                        <p className="font-medium">{appointment.doctor.name}</p>
                        {appointment.doctor.specialization && (
                          <p className="text-sm text-muted-foreground">
                            {appointment.doctor.specialization}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Attendance Status */}
                    <div className="space-y-2">
                      <div className="flex items-center text-sm font-medium">
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                        Status
                      </div>
                      <div className="pl-6">
                        <Badge variant="outline" className="text-xs">
                          {appointment.attendance_status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button variant="outline" size="sm">
                      <Phone className="mr-2 h-4 w-4" />
                      Contact Office
                    </Button>
                    <Button variant="outline" size="sm">
                      <Calendar className="mr-2 h-4 w-4" />
                      Reschedule
                    </Button>

                    {/* Debug: Show cancel button for all scheduled appointments */}
                    {appointment.status.toLowerCase() === "scheduled" &&
                      (canCancel ? (
                        <Button onClick={() => openCancelDialog(appointment)}>
                          Cancel
                        </Button>
                      ) : (
                        <Button disabled variant="outline" size="sm">
                          <X className="mr-2 h-4 w-4" />
                          Cannot Cancel (&lt; 24h)
                        </Button>
                      ))}
                  </div>

                  {/* Cancellation Notice */}
                  {appointment.status.toLowerCase() !== "cancelled" && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Reminder:</strong> Please arrive 15 minutes
                        before your scheduled appointment time. Bring a valid ID
                        and any relevant medical documents.
                        {!canCancel &&
                          appointment.status.toLowerCase() === "scheduled" && (
                            <span className="block mt-1">
                              <strong>Note:</strong> Appointments can only be
                              cancelled up to 24 hours in advance.
                            </span>
                          )}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Additional Actions */}
      <div className="mt-8 flex justify-center gap-4">
        <Button asChild variant="outline">
          <Link to="/patient/appointments/history">
            View Appointment History
          </Link>
        </Button>
        <Button asChild>
          <Link to="/patient/appointments/request">
            Request New Appointment
          </Link>
        </Button>
      </div>

      {/* Cancel Appointment Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Appointment Details:</h4>
                <p className="text-sm">
                  <strong>Service:</strong>{" "}
                  {selectedAppointment.service_type.replace("_", " ")}
                </p>
                <p className="text-sm">
                  <strong>Doctor:</strong> {selectedAppointment.doctor.name}
                </p>
                <p className="text-sm">
                  <strong>Date & Time:</strong>{" "}
                  {
                    formatAppointmentTime(
                      selectedAppointment.start_time,
                      selectedAppointment.end_time
                    ).date
                  }{" "}
                  at{" "}
                  {
                    formatAppointmentTime(
                      selectedAppointment.start_time,
                      selectedAppointment.end_time
                    ).time
                  }
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancellation_reason">
                  Reason for Cancellation (Optional)
                </Label>
                <Textarea
                  id="cancellation_reason"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Please let us know why you're cancelling (optional)"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={cancelLoading}
            >
              Keep Appointment
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelAppointment}
              disabled={cancelLoading}
            >
              {cancelLoading ? "Cancelling..." : "Cancel Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
