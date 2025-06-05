import { useState, useEffect, useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  // isAfter,
  // isBefore,
  // addDays,
} from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import api from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import { Badge } from "@/components/ui/badge";
// Setup the localizer for react-big-calendar
const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Service {
  service_id: number;
  service_type: string;
  start_time: string;
  end_time: string;
  status: string;
  cancel_reason?: string;
  doctor: {
    doctor_id: number;
    employee: {
      user: {
        first_name: string;
        last_name: string;
      };
    };
    specialization: string | null;
  };
  serviceParticipants?: ServiceParticipant[];
}

interface ServiceParticipant {
  participant_id: number;
  service_id: number;
  patient_id: number;
  attendance_status?: string;
  patient: {
    patient_id: number;
    user: {
      first_name: string;
      last_name: string;
    };
  };
}

interface Doctor {
  doctor_id: number;
  employee: {
    user: {
      first_name: string;
      last_name: string;
    };
  };
  specialization: string | null;
}

interface Patient {
  patient_id: number;
  user: {
    first_name: string;
    last_name: string;
  };
}

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: Service;
}

// Define the service type enum matching your schema
const SERVICE_TYPES = {
  Consultation: "Consultation",
  Group_Consultation: "Group_Consultation",
} as const;

// Define service duration presets in minutes
const SERVICE_DURATIONS = {
  "30": "30 minutes",
  "45": "45 minutes",
  "60": "60 minutes (1 hour)",
  "90": "90 minutes (1.5 hours)",
  "120": "120 minutes (2 hours)",
};

// Update the toolbar props interface
interface CustomToolbarProps {
  onNavigate: (action: "PREV" | "NEXT" | "TODAY") => void;
  label: string;
  doctorFilter: string;
  setDoctorFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  patientSearch: string;
  setPatientSearch: (value: string) => void;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  doctors: Doctor[];
}

const CustomToolbar = ({
  onNavigate,
  label,
  doctorFilter,
  setDoctorFilter,
  statusFilter,
  setStatusFilter,
  patientSearch,
  setPatientSearch,
  showFilters,
  setShowFilters,
  doctors,
}: CustomToolbarProps) => {
  // Add local state for patient search input
  const [localPatientSearch, setLocalPatientSearch] = useState(patientSearch);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalPatientSearch(e.target.value);
  };

  // Update parent state on blur or when Enter is pressed
  const handleSearchSubmit = () => {
    setPatientSearch(localPatientSearch);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  // Sync local state when parent state changes
  useEffect(() => {
    setLocalPatientSearch(patientSearch);
  }, [patientSearch]);

  return (
    <div className="flex flex-col gap-2">
      <div className="rbc-toolbar">
        <span className="rbc-btn-group">
          <button type="button" onClick={() => onNavigate("PREV")}>
            Back
          </button>
          <button type="button" onClick={() => onNavigate("TODAY")}>
            Today
          </button>
          <button type="button" onClick={() => onNavigate("NEXT")}>
            Next
          </button>
        </span>
        <span className="rbc-toolbar-label">{label}</span>
        <button
          type="button"
          className="rbc-btn-group"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {showFilters && (
        <div className="flex gap-4 py-2 px-4 bg-background border rounded-md mb-2">
          <div className="w-1/3">
            <Label htmlFor="doctor-filter">Doctor</Label>
            <Select value={doctorFilter} onValueChange={setDoctorFilter}>
              <SelectTrigger id="doctor-filter" className="h-8">
                <SelectValue placeholder="All Doctors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Doctors</SelectItem>
                {doctors.map((doctor) => (
                  <SelectItem
                    key={doctor.doctor_id}
                    value={doctor.doctor_id.toString()}
                  >
                    {doctor.employee.user.first_name}{" "}
                    {doctor.employee.user.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-1/3">
            <Label htmlFor="status-filter">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status-filter" className="h-8">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-1/3">
            <Label htmlFor="patient-search">Patient Search</Label>
            <div className="flex">
              <Input
                id="patient-search"
                value={localPatientSearch}
                onChange={handleSearchChange}
                onBlur={handleSearchSubmit}
                onKeyDown={handleKeyDown}
                placeholder="Search patient name"
                className="h-8"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSearchSubmit}
                className="ml-2 h-8"
              >
                Search
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface EventComponentProps {
  event: CalendarEvent;
}

// Update the EventComponent to use inline styles for reliable centering
const EventComponent = ({ event }: EventComponentProps) => {
  const service = event.resource;

  // Format the time to show at the top
  const startTime = format(new Date(service.start_time), "h:mm a");
  const endTime = format(new Date(service.end_time), "h:mm a");
  const timeLabel = `${startTime} – ${endTime}`;

  // Determine background color and text colors based on status
  const getColors = () => {
    switch (service.status) {
      case "Cancelled":
        return {
          bg: "#fecaca", // Lighter red
          headerBg: "#ef4444", // Stronger red for header
          headerText: "white",
          contentText: "#7f1d1d", // Dark red text for better contrast
        };
      case "Completed":
        return {
          bg: "#bbf7d0", // Lighter green
          headerBg: "#22c55e", // Stronger green for header
          headerText: "white",
          contentText: "#14532d", // Dark green text for better contrast
        };
      default:
        return {
          bg: "#bfdbfe", // Lighter blue
          headerBg: "#3b82f6", // Stronger blue for header
          headerText: "white",
          contentText: "#1e3a8a", // Dark blue text for better contrast
        };
    }
  };

  const colors = getColors();

  return (
    <div
      style={{
        height: "100%", // Full height
        width: "100%",
        backgroundColor: colors.bg,
        borderRadius: "6px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Time header */}
      <div
        style={{
          backgroundColor: colors.headerBg,
          color: colors.headerText,
          padding: "2px 6px",
          fontSize: "0.75rem",
          fontWeight: 500,
          textAlign: "center",
          width: "100%",
        }}
      >
        {timeLabel}
      </div>

      {/* Content area */}
      <div
        style={{
          flex: 1, // Takes up all remaining space
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "6px",
          color: colors.contentText, // Improved contrast
        }}
      >
        <p
          style={{
            fontWeight: 600, // Increased weight for better visibility
            fontSize: "0.875rem",
            textAlign: "center",
            width: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {service.service_type.replace("_", " ")}
        </p>
        <p
          style={{
            fontSize: "0.75rem",
            textAlign: "center",
            width: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: 500, // Medium weight for better visibility
          }}
        >
          Dr. {service.doctor.employee.user.first_name}{" "}
          {service.doctor.employee.user.last_name}
        </p>
        {service.serviceParticipants &&
          service.serviceParticipants.length > 0 && (
            <p
              style={{
                fontSize: "0.75rem",
                color: colors.contentText, // Match content text color
                textAlign: "center",
                width: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {service.serviceParticipants.length > 1
                ? `${service.serviceParticipants.length} patients`
                : `${service.serviceParticipants[0].patient.user.first_name} ${service.serviceParticipants[0].patient.user.last_name}`}
            </p>
          )}
      </div>
    </div>
  );
};

export default function AppointmentCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [showNewAppointment, setShowNewAppointment] = useState(false);

  // Add a duration state for easier time calculation
  const [duration, setDuration] = useState("60");

  const [newAppointment, setNewAppointment] = useState({
    service_type: "Consultation", // Default to Consultation from enum
    doctor_id: "",
    patient_id: "", // Keep this for single patient selection
    start_time: "",
    end_time: "",
    notes: "",
  });

  // Add a new state for multiple patients
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);

  // Add these new state variables
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Remove dateFilter state and add patientSearch
  const [patientSearch, setPatientSearch] = useState("");
  const [debouncedPatientSearch, setDebouncedPatientSearch] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("Scheduled");
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPatientSearch(patientSearch);
    }, 300); // 300ms delay before applying search

    return () => clearTimeout(timer);
  }, [patientSearch]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await api.get("/services");

        // Convert services to calendar events
        const calendarEvents: CalendarEvent[] = response.data.map(
          (service: Service) => ({
            id: service.service_id,
            title: `${service.service_type} - ${service.doctor.employee.user.first_name} ${service.doctor.employee.user.last_name}`,
            start: new Date(service.start_time),
            end: new Date(service.end_time),
            resource: service,
          })
        );

        setEvents(calendarEvents);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch services:", err);
        setError("Failed to load appointments. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    const fetchDoctorsAndPatients = async () => {
      try {
        // For patients, keep the existing approach
        const patientsResponse = await api.get("/patients");
        setPatients(patientsResponse.data);

        // For doctors, use the employees endpoint like in AddServiceForm
        const employeesResponse = await api.get("/employees");

        // Filter to get only active doctors
        const doctorEmployees = employeesResponse.data.filter(
          (employee) =>
            employee.user.userRoles?.some(
              (role) => role.role.role_name === "doctor"
            ) && employee.user.is_active === true
        );

        // Map to the expected doctor format
        const mappedDoctors = doctorEmployees.map((employee) => ({
          doctor_id: employee.doctor?.doctor_id || employee.employee_id,
          employee: {
            user: {
              first_name: employee.user.first_name,
              last_name: employee.user.last_name,
            },
          },
          specialization: employee.doctor?.specialization || null,
        }));

        setDoctors(mappedDoctors);
      } catch (err) {
        console.error("Failed to fetch doctors or patients:", err);
        setError("Failed to load doctors or patients. Please try again later.");
      }
    };

    fetchServices();
    fetchDoctorsAndPatients();
  }, []);

  // Filter events based on filter criteria
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Doctor filter
      if (
        doctorFilter !== "all" &&
        event.resource.doctor.doctor_id.toString() !== doctorFilter
      ) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && event.resource.status !== statusFilter) {
        return false;
      }

      // Patient search filter - now using debounced value
      if (debouncedPatientSearch && event.resource.serviceParticipants) {
        const searchLower = debouncedPatientSearch.toLowerCase();
        const hasMatchingPatient = event.resource.serviceParticipants.some(
          (participant) => {
            const fullName =
              `${participant.patient.user.first_name} ${participant.patient.user.last_name}`.toLowerCase();
            return fullName.includes(searchLower);
          }
        );

        if (!hasMatchingPatient) {
          return false;
        }
      }

      return true;
    });
  }, [events, doctorFilter, statusFilter, debouncedPatientSearch]);

  const handleEventSelect = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleCloseEventDialog = () => {
    setSelectedEvent(null);
  };

  // Update the cancel flow to show the reason dialog
  const handleCancelPrompt = () => {
    setShowCancelDialog(true);
  };

  const handleCancelAppointment = async () => {
    if (!selectedEvent) return;

    try {
      // Send the cancel reason provided by the user
      await api.patch(`/services/${selectedEvent.id}/cancel`, {
        cancel_reason: cancelReason || "No reason provided",
      });

      // Update the events list
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === selectedEvent.id
            ? {
                ...event,
                resource: {
                  ...event.resource,
                  status: "Cancelled",
                  cancel_reason: cancelReason || "No reason provided",
                },
              }
            : event
        )
      );

      // Close both dialogs
      setSelectedEvent(null);
      setShowCancelDialog(false);
      setCancelReason("");
    } catch (err) {
      console.error("Failed to cancel appointment:", err);
      setError("Failed to cancel appointment. Please try again.");
    }
  };

  const handleDateSelect = (slotInfo: { start: Date; end: Date }) => {
    // Open the new appointment form with the selected date/time
    setNewAppointment((prev) => ({
      ...prev,
      start_time: format(slotInfo.start, "yyyy-MM-dd'T'HH:mm"),
      end_time: format(
        new Date(slotInfo.start.getTime() + 60 * 60 * 1000),
        "yyyy-MM-dd'T'HH:mm"
      ),
    }));
    setShowNewAppointment(true);
  };

  const handleCreateAppointment = async () => {
    try {
      // Prepare the data based on service type
      let requestData;

      if (newAppointment.service_type === "Consultation") {
        // For regular consultations, use the existing structure
        requestData = {
          ...newAppointment,
        };
      } else {
        // For group consultations, prepare the patients array
        requestData = {
          ...newAppointment,
          patient_ids: selectedPatients, // Send array of patient IDs instead of single patient_id
          patient_id: undefined, // Remove the single patient_id field
        };
      }

      const response = await api.post("/services", requestData);

      // Add the new event to the calendar
      const newService = response.data;
      const newEvent: CalendarEvent = {
        id: newService.service_id,
        title: `${newService.service_type.replace("_", " ")} - ${
          doctors.find(
            (d) => d.doctor_id.toString() === newAppointment.doctor_id
          )?.employee.user.first_name || ""
        } ${
          doctors.find(
            (d) => d.doctor_id.toString() === newAppointment.doctor_id
          )?.employee.user.last_name || ""
        }`,
        start: new Date(newService.start_time),
        end: new Date(newService.end_time),
        resource: newService,
      };

      setEvents([...events, newEvent]);
      setShowNewAppointment(false);

      // Reset all form state
      setNewAppointment({
        service_type: "Consultation",
        doctor_id: "",
        patient_id: "",
        start_time: "",
        end_time: "",
        notes: "",
      });
      setSelectedPatients([]);
    } catch (err) {
      console.error("Failed to create appointment:", err);
      setError("Failed to create appointment. Please try again.");
    }
  };

  const handleNewAppointmentChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setNewAppointment((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewAppointment((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Update this function to calculate end_time based on duration
  const handleDurationChange = (value: string) => {
    setDuration(value);

    // Only calculate end time if start time exists
    if (newAppointment.start_time) {
      const startTime = new Date(newAppointment.start_time);
      const endTime = new Date(startTime.getTime() + parseInt(value) * 60000);

      setNewAppointment((prev) => ({
        ...prev,
        end_time: format(endTime, "yyyy-MM-dd'T'HH:mm"),
      }));
    }
  };

  // Update your start time handler to also update end time based on duration
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startTime = new Date(e.target.value);
    const endTime = new Date(startTime.getTime() + parseInt(duration) * 60000);

    setNewAppointment((prev) => ({
      ...prev,
      start_time: e.target.value,
      end_time: format(endTime, "yyyy-MM-dd'T'HH:mm"),
    }));
  };

  // Update the styles to ensure events properly fit in their time slots
  const calendarStyles = `
  /* Event container - make sure it fits properly in the slot */
  .rbc-event {
    padding: 0 !important;
    border: none !important;
    border-radius: 6px !important;
    overflow: hidden !important;
    margin: 0 !important;
  }
  
  /* Event content - center everything */
  .rbc-event-content {
    width: 100% !important;
    height: 100% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  
  /* Fix the event positioning within the slot */
  .rbc-event-label {
    display: none !important; /* Hide the default time label */
  }
  
  /* Ensure events take full width of their cell */
  .rbc-events-container {
    width: 100% !important;
  }
  
  /* Make the events respect the time slot boundaries */
  .rbc-timeslot-group {
    min-height: 60px !important;
  }
  
  /* Ensure calendar rows are tall enough */
  .rbc-time-slot {
    min-height: 15px !important;
  }
  
  /* Hide the all-day section completely */
  .rbc-allday-cell {
    display: none !important;
  }
  
  /* Remove the extra row */
  .rbc-row.rbc-row-resource {
    display: none !important;
  }
  
  /* Fix the header spacing */
  .rbc-time-header-content {
    border-left: none !important;
    margin-left: 0 !important;
  }
`;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Appointment Calendar</h1>
        <Button onClick={() => setShowNewAppointment(true)}>
          Schedule New Appointment
        </Button>
      </div>

      {error && <ApiErrorDisplay error={error} className="mb-4" />}

      <Card>
        <CardContent className="p-4 h-[1000px]">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <p>Loading calendar...</p>
            </div>
          ) : (
            <>
              <style>{calendarStyles}</style>
              <Calendar
                localizer={localizer}
                events={filteredEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%" }}
                onSelectEvent={handleEventSelect}
                onSelectSlot={handleDateSelect}
                selectable
                views={["week"]}
                defaultView="week"
                step={15}
                timeslots={4}
                min={new Date(new Date().setHours(10, 0, 0))} // Start at 8 AM for more space
                max={new Date(new Date().setHours(21, 0, 0))} // End at 10 PM for more space
                components={{
                  toolbar: (toolbarProps) => (
                    <CustomToolbar
                      {...toolbarProps}
                      doctorFilter={doctorFilter}
                      setDoctorFilter={setDoctorFilter}
                      statusFilter={statusFilter}
                      setStatusFilter={setStatusFilter}
                      patientSearch={patientSearch}
                      setPatientSearch={setPatientSearch}
                      showFilters={showFilters}
                      setShowFilters={setShowFilters}
                      doctors={doctors}
                    />
                  ),
                  event: EventComponent,
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Appointment Details Dialog */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={handleCloseEventDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedEvent.resource.service_type}</DialogTitle>
              <DialogDescription>Appointment Details</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div>
                <Badge
                  className={
                    selectedEvent.resource.status === "Scheduled"
                      ? "bg-blue-100 text-blue-800"
                      : selectedEvent.resource.status === "Completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }
                >
                  {selectedEvent.resource.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Doctor</Label>
                  <p className="text-sm">
                    {selectedEvent.resource.doctor.employee.user.first_name}{" "}
                    {selectedEvent.resource.doctor.employee.user.last_name}
                    {selectedEvent.resource.doctor.specialization &&
                      ` (${selectedEvent.resource.doctor.specialization})`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <p className="text-sm">
                    {format(selectedEvent.start, "PPpp")}
                  </p>
                </div>

                <div>
                  <Label>End Time</Label>
                  <p className="text-sm">{format(selectedEvent.end, "PPpp")}</p>
                </div>
              </div>

              {/* Show cancel reason if status is cancelled */}
              {selectedEvent.resource.status === "Cancelled" &&
                selectedEvent.resource.cancel_reason && (
                  <div>
                    <Label>Cancellation Reason</Label>
                    <p className="text-sm">
                      {selectedEvent.resource.cancel_reason}
                    </p>
                  </div>
                )}

              {/* Show all patients for this appointment */}
              <div>
                <Label>
                  Patient
                  {selectedEvent.resource.serviceParticipants &&
                  selectedEvent.resource.serviceParticipants.length > 1
                    ? "s"
                    : ""}
                </Label>
                {selectedEvent.resource.serviceParticipants &&
                selectedEvent.resource.serviceParticipants.length > 0 ? (
                  <div className="mt-1">
                    {selectedEvent.resource.serviceParticipants.map(
                      (participant) => (
                        <p
                          key={participant.participant_id}
                          className="text-sm mb-1"
                        >
                          {participant.patient.user.first_name}{" "}
                          {participant.patient.user.last_name}
                          {participant.attendance_status &&
                            participant.attendance_status !== "Expected" &&
                            ` (${participant.attendance_status})`}
                        </p>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No patients assigned
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseEventDialog}>
                Close
              </Button>
              {selectedEvent.resource.status === "Scheduled" && (
                <Button variant="destructive" onClick={handleCancelPrompt}>
                  Cancel Appointment
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Cancellation Reason Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="cancel-reason">Cancellation Reason</Label>
            <Textarea
              id="cancel-reason"
              placeholder="Enter reason for cancellation"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="h-24"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Back
            </Button>
            <Button variant="destructive" onClick={handleCancelAppointment}>
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Appointment Dialog with multi-patient support */}
      <Dialog open={showNewAppointment} onOpenChange={setShowNewAppointment}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule New Appointment</DialogTitle>
            <DialogDescription>
              Create a new appointment for{" "}
              {newAppointment.service_type === "Group_Consultation"
                ? "multiple patients"
                : "a patient"}
              .
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="service_type">Service Type</Label>
              <Select
                name="service_type"
                value={newAppointment.service_type}
                onValueChange={(value) => {
                  handleSelectChange("service_type", value);
                  // Clear selected patients when switching service types
                  if (value === "Consultation") {
                    setSelectedPatients([]);
                  } else if (value === "Group_Consultation") {
                    setNewAppointment((prev) => ({ ...prev, patient_id: "" }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SERVICE_TYPES).map(([key, value]) => (
                    <SelectItem key={key} value={value}>
                      {value.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="doctor_id">Doctor</Label>
              <Select
                name="doctor_id"
                value={newAppointment.doctor_id}
                onValueChange={(value) =>
                  handleSelectChange("doctor_id", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem
                      key={doctor.doctor_id}
                      value={doctor.doctor_id.toString()}
                    >
                      {doctor.employee.user.first_name}{" "}
                      {doctor.employee.user.last_name}
                      {doctor.specialization && ` (${doctor.specialization})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Show either single patient selector or multiple patient selector */}
            {newAppointment.service_type === "Consultation" ? (
              <div>
                <Label htmlFor="patient_id">Patient</Label>
                <Select
                  name="patient_id"
                  value={newAppointment.patient_id}
                  onValueChange={(value) =>
                    handleSelectChange("patient_id", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem
                        key={patient.patient_id}
                        value={patient.patient_id.toString()}
                      >
                        {patient.user.first_name} {patient.user.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label className="mb-2 block">Group Participants</Label>
                <div className="border rounded-md p-3 h-[120px] overflow-y-auto mb-2 select-none">
                  {selectedPatients.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No patients selected
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {selectedPatients.map((patientId) => {
                        const patient = patients.find(
                          (p) => p.patient_id.toString() === patientId
                        );
                        return (
                          <li
                            key={patientId}
                            className="flex justify-between items-center text-sm"
                          >
                            <span className="select-none">
                              {patient?.user.first_name}{" "}
                              {patient?.user.last_name}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPatients((prev) =>
                                  prev.filter((id) => id !== patientId)
                                );
                              }}
                            >
                              Remove
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <Select
                  value="" // Add this line to keep the value empty
                  onValueChange={(value) => {
                    if (!selectedPatients.includes(value)) {
                      setSelectedPatients((prev) => [...prev, value]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add patient to group" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients
                      .filter(
                        (patient) =>
                          !selectedPatients.includes(
                            patient.patient_id.toString()
                          )
                      )
                      .map((patient) => (
                        <SelectItem
                          key={patient.patient_id}
                          value={patient.patient_id.toString()}
                        >
                          {patient.user.first_name} {patient.user.last_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                type="datetime-local"
                id="start_time"
                name="start_time"
                value={newAppointment.start_time}
                onChange={handleStartTimeChange}
              />
            </div>

            <div>
              <Label htmlFor="end_time">End Time</Label>
              <Input
                type="datetime-local"
                id="end_time"
                name="end_time"
                value={newAppointment.end_time}
                onChange={handleNewAppointmentChange}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Enter any additional notes"
                value={newAppointment.notes}
                onChange={handleNewAppointmentChange}
                className="h-24"
              />
            </div>

            <div>
              <Label htmlFor="duration">Duration</Label>
              <Select value={duration} onValueChange={handleDurationChange}>
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SERVICE_DURATIONS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewAppointment(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateAppointment}>
              Confirm Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>
        {`
          .rbc-event {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0 !important;
          }

          .rbc-event-content {
            width: 100% !important;
            height: 100% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
        `}
      </style>
    </div>
  );
}
