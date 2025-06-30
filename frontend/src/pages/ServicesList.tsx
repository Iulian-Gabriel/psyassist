// src/pages/ServicesList.tsx (FIXED VERSION for linting warnings)
import React, { useState, useEffect, useMemo, useCallback } from "react"; // Add useCallback
import { Link, useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { ColumnHeader } from "@/components/ui/data-table/ColumnHeader";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Eye,
  Info,
  CheckCircle,
  FileText,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
} from "lucide-react"; // Add Eye and Info icons
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Service {
  service_id: number;
  service_type: string;
  start_time: string;
  end_time: string;
  status: string;
  doctor: {
    employee: {
      user: {
        first_name: string;
        last_name: string;
      };
    };
  };
  serviceParticipants: Array<{
    patient: {
      user: {
        first_name: string;
        last_name: string;
      };
    };
  }>;
}

interface ServicesListProps {
  isDoctorView?: boolean;
  userRole?: string; // Add this prop
}

export default function ServicesList({
  isDoctorView = false,
  userRole, // Add this parameter
}: ServicesListProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  // Add these new state variables
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [assessmentModalOpen, setAssessmentModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        let endpoint = "/services";
        if (isDoctorView) {
          endpoint = "/doctor/current/services";
        }
        const response = await api.get(endpoint);
        setServices(response.data);
        setError(null);
      } catch (err: unknown) {
        console.error("Failed to fetch services:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : typeof err === "object" &&
              err !== null &&
              "response" in err &&
              err.response &&
              typeof err.response === "object" &&
              "data" in err.response &&
              err.response.data &&
              typeof err.response.data === "object" &&
              "message" in err.response.data &&
              typeof err.response.data.message === "string"
            ? err.response.data.message
            : "Failed to load services. Please try again later.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [isDoctorView]); // Re-run effect if view mode changes

  // Wrap formatDateTime in useCallback
  const formatDateTime = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString();
  }, []); // Empty dependency array because it doesn't depend on any props/state

  const handleCompleteService = useCallback(async (serviceId: number) => {
    if (!confirm("Are you sure you want to mark this service as complete?")) {
      return;
    }
    try {
      await api.patch(`/services/${serviceId}/complete`);
      setServices((prev) =>
        prev.map((service) =>
          service.service_id === serviceId
            ? { ...service, status: "Completed" }
            : service
        )
      );
      toast.success("Service marked as completed.");
    } catch (err) {
      console.error("Failed to complete service:", err);
      toast.error("Failed to complete service. Please try again.");
    }
  }, []);

  // Wrap handleCancelService in useCallback
  const handleCancelService = useCallback(
    async (serviceId: number) => {
      if (!confirm("Are you sure you want to cancel this service?")) {
        return;
      }

      try {
        await api.patch(`/services/${serviceId}/cancel`, {
          cancel_reason: `Cancelled by ${isDoctorView ? "doctor" : "admin"}`,
        });
        // To update the state, we need 'services' and 'setServices'
        // These are stable if no other warnings/errors related to them,
        // but if you ever get one, you might add 'services' here and 'setServices' too.
        // For now, let's assume `setServices` is stable (which it usually is).
        setServices((prevServices) =>
          prevServices.map((service) =>
            service.service_id === serviceId
              ? { ...service, status: "Cancelled" }
              : service
          )
        );
      } catch (err) {
        console.error("Failed to cancel service:", err);
        setError("Failed to cancel service. Please try again.");
      }
    },
    [isDoctorView, setServices]
  ); // Depends on isDoctorView and setServices

  const handleViewPatient = useCallback(
    (patientId: number) => {
      // This route will depend on your admin/doctor section setup
      navigate(`/doctor/patients/${patientId}`);
    },
    [navigate]
  );

  // Add this new handler function
  const handleViewAssessmentModal = useCallback(async (patientId: number) => {
    try {
      // Change this line to use the correct endpoint
      const response = await api.get(
        `/patients/${patientId}/assessment-results`
      );
      setSelectedAssessment(response.data);
      setAssessmentModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch assessment results:", err);
      toast.error("Failed to load assessment results");
    }
  }, []);

  // Update the handleViewInitialTest function to use the modal
  const handleViewInitialTest = useCallback(
    (patientId: number) => {
      if (isDoctorView) {
        handleViewAssessmentModal(patientId);
      } else {
        navigate(`/doctor/initial-assessment/results/${patientId}`);
      }
    },
    [isDoctorView, navigate, handleViewAssessmentModal]
  );

  // Add this new handler function
  const handleViewServiceDetails = useCallback(
    (serviceId: number) => {
      if (isDoctorView) {
        navigate(`/doctor/services/${serviceId}/details`);
      } else {
        navigate(`/admin/services/${serviceId}/details`);
      }
    },
    [isDoctorView, navigate]
  );

  // Add these new handler functions
  const handleViewPatientModal = useCallback(async (patientId: number) => {
    try {
      const response = await api.get(`/patients/${patientId}`);
      setSelectedPatient(response.data);
      setPatientModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch patient details:", err);
      toast.error("Failed to load patient details");
    }
  }, []);

  const handleViewServiceModal = useCallback(async (serviceId: number) => {
    try {
      const response = await api.get(`/services/${serviceId}`);
      setSelectedService(response.data);
      setServiceModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch service details:", err);
      toast.error("Failed to load service details");
    }
  }, []);

  // Helper function to get score interpretation
  const getScoreInterpretation = useCallback(
    (score: number, maxScore: number) => {
      const percentage = (score / maxScore) * 100;
      if (percentage < 25)
        return { level: "Low", color: "bg-green-100 text-green-800" };
      if (percentage < 50)
        return { level: "Moderate", color: "bg-yellow-100 text-yellow-800" };
      if (percentage < 75)
        return { level: "High", color: "bg-orange-100 text-orange-800" };
      return { level: "Very High", color: "bg-red-100 text-red-800" };
    },
    []
  );

  // Use useMemo to define columns, so they are not recreated on every render
  const columns: ColumnDef<Service>[] = useMemo(() => {
    const baseColumns: ColumnDef<Service>[] = [
      {
        accessorKey: "service_id",
        header: ({ column }) => <ColumnHeader column={column} title="ID" />,
      },
      {
        accessorKey: "service_type",
        header: ({ column }) => <ColumnHeader column={column} title="Type" />,
      },
    ];

    if (!isDoctorView) {
      baseColumns.push({
        id: "doctor_name",
        accessorFn: (row) =>
          `${row.doctor.employee.user.first_name} ${row.doctor.employee.user.last_name}`,
        header: ({ column }) => <ColumnHeader column={column} title="Doctor" />,
        cell: ({ row }) => (
          <div>
            {row.original.doctor.employee.user.first_name}{" "}
            {row.original.doctor.employee.user.last_name}
          </div>
        ),
      });
    } else {
      baseColumns.push({
        id: "patient_name",
        accessorFn: (row) =>
          row.serviceParticipants
            .map(
              (sp) =>
                `${sp.patient.user.first_name} ${sp.patient.user.last_name}`
            )
            .join(", "),
        header: ({ column }) => (
          <ColumnHeader column={column} title="Patient(s)" />
        ),
        cell: ({ row }) => (
          <div>
            {row.original.serviceParticipants
              .map(
                (sp) =>
                  `${sp.patient.user.first_name} ${sp.patient.user.last_name}`
              )
              .join(", ")}
          </div>
        ),
      });
    }

    baseColumns.push(
      {
        id: "start_time",
        accessorFn: (row) => row.start_time,
        header: ({ column }) => (
          <ColumnHeader column={column} title="Start Time" />
        ),
        cell: ({ row }) => formatDateTime(row.original.start_time),
      },
      {
        id: "end_time",
        accessorFn: (row) => row.end_time,
        header: ({ column }) => (
          <ColumnHeader column={column} title="End Time" />
        ),
        cell: ({ row }) => formatDateTime(row.original.end_time),
      },
      {
        accessorKey: "status",
        header: ({ column }) => <ColumnHeader column={column} title="Status" />,
        cell: ({ row }) => (
          <Badge
            className={`${
              row.original.status === "Scheduled"
                ? "bg-blue-100 text-blue-800"
                : row.original.status === "Completed"
                ? "bg-green-100 text-green-800"
                : row.original.status === "Cancelled"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-1">
            {isDoctorView && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleViewPatientModal(
                      row.original.serviceParticipants[0].patient.patient_id
                    )
                  }
                  title="View Patient Details"
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleViewServiceModal(row.original.service_id)
                  }
                  title="View Service Details"
                  className="h-8 w-8 p-0"
                >
                  <Info className="h-4 w-4" />
                </Button>
                {/* Show assessment button only in doctor view */}
                {isDoctorView && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleViewInitialTest(
                        row.original.serviceParticipants[0].patient.patient_id
                      )
                    }
                    title="View Initial Assessment Results"
                    className="h-8 w-8 p-0"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCompleteService(row.original.service_id)}
                  disabled={
                    row.original.status === "Cancelled" ||
                    row.original.status === "Completed"
                  }
                  title={
                    row.original.status === "Scheduled"
                      ? "Mark as Completed"
                      : `Service already ${row.original.status.toLowerCase()}`
                  }
                  className="h-8 w-8 p-0"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </>
            )}
            {/* Only show assessment button for admin users in non-doctor view */}
            {!isDoctorView && userRole === "admin" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleViewInitialTest(
                    row.original.serviceParticipants[0].patient.patient_id
                  )
                }
                title="View Initial Assessment Results"
                className="h-8 w-8 p-0"
              >
                <FileText className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleCancelService(row.original.service_id)}
              disabled={
                row.original.status === "Cancelled" ||
                row.original.status === "Completed"
              }
              title={
                row.original.status === "Scheduled"
                  ? "Cancel Service"
                  : `Service already ${row.original.status.toLowerCase()}`
              }
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      }
    );

    return baseColumns;
  }, [
    isDoctorView,
    userRole, // Add this to dependencies
    formatDateTime,
    handleCancelService,
    handleViewServiceModal,
    handleCompleteService,
    handleViewPatientModal,
    handleViewInitialTest,
    handleViewAssessmentModal,
  ]);

  const searchableColumns = useMemo(() => {
    const columns = [
      { id: "service_type", title: "Type" },
      { id: "status", title: "Status" },
    ];

    if (!isDoctorView) {
      columns.push({ id: "doctor_name", title: "Doctor" });
    } else {
      columns.push({ id: "patient_name", title: "Patient" });
    }
    return columns;
  }, [isDoctorView]);

  const filterableColumns = useMemo(
    () => [
      {
        id: "service_type",
        title: "Service Type",
        options: [
          ...Array.from(
            new Set(services.map((service) => service.service_type))
          ).map((type) => ({ value: type, label: type })),
        ],
      },
      {
        id: "status",
        title: "Status",
        options: [
          { value: "Scheduled", label: "Scheduled" },
          { value: "Completed", label: "Completed" },
          { value: "Cancelled", label: "Cancelled" },
        ],
      },
    ],
    [services]
  );

  const pageTitle = isDoctorView ? "My Services" : "Services Management";
  const backButtonLink = isDoctorView ? "/dashboard" : "/admin";
  const newServiceButton = !isDoctorView && (
    <Link to="/admin/services/new">
      <Button variant="default">New Service</Button>
    </Link>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p>Loading services...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{pageTitle}</h1>
        <div className="space-x-2">
          {newServiceButton}
          <Link to={backButtonLink}>
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{pageTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <ApiErrorDisplay error={error} />
          ) : (
            <DataTable
              columns={columns}
              data={services}
              searchableColumns={searchableColumns}
              filterableColumns={filterableColumns}
              pagination={true}
            />
          )}
        </CardContent>
      </Card>

      {/* Patient Details Modal */}
      <Dialog open={patientModalOpen} onOpenChange={setPatientModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl">
              <User className="mr-2 h-6 w-6" />
              {selectedPatient
                ? `${selectedPatient.user.first_name} ${selectedPatient.user.last_name}`
                : "Patient Details"}
            </DialogTitle>
            <DialogDescription>
              View detailed patient information and contact details.
            </DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Contact Information</h3>
                <p className="flex items-center">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                  {selectedPatient.user.email}
                </p>
                <p className="flex items-center">
                  <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                  {selectedPatient.user.phone_number}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Personal Information</h3>
                <p className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  Born on{" "}
                  {new Date(
                    selectedPatient.user.date_of_birth
                  ).toLocaleDateString()}
                </p>
                <p className="capitalize flex items-center">
                  <User className="mr-2 h-4 w-4 text-muted-foreground" />
                  {selectedPatient.user.gender}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Address</h3>
                <p className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                  {selectedPatient.user.address_street},{" "}
                  {selectedPatient.user.address_city},
                  {selectedPatient.user.address_postal_code},{" "}
                  {selectedPatient.user.address_country}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Emergency Contact</h3>
                <p>
                  <strong>Name:</strong>{" "}
                  {selectedPatient.emergency_contact_name || "N/A"}
                </p>
                <p>
                  <strong>Phone:</strong>{" "}
                  {selectedPatient.emergency_contact_phone || "N/A"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Service Details Modal */}
      <Dialog open={serviceModalOpen} onOpenChange={setServiceModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl">
              <Info className="mr-2 h-6 w-6" />
              Service Details
            </DialogTitle>
            <DialogDescription>
              View comprehensive service information and participants.
            </DialogDescription>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Service ID</h3>
                  <p>{selectedService.service_id}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Service Type</h3>
                  <p>{selectedService.service_type}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Start Time</h3>
                  <p>{formatDateTime(selectedService.start_time)}</p>
                </div>
                <div>
                  <h3 className="font-semibold">End Time</h3>
                  <p>{formatDateTime(selectedService.end_time)}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Status</h3>
                  <Badge
                    className={`${
                      selectedService.status === "Scheduled"
                        ? "bg-blue-100 text-blue-800"
                        : selectedService.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : selectedService.status === "Cancelled"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {selectedService.status}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold">Doctor</h3>
                  <p>
                    {selectedService.doctor?.employee?.user?.first_name}{" "}
                    {selectedService.doctor?.employee?.user?.last_name}
                  </p>
                </div>
              </div>
              {selectedService.serviceParticipants &&
                selectedService.serviceParticipants.length > 0 && (
                  <div>
                    <h3 className="font-semibold">Participants</h3>
                    <ul className="list-disc list-inside">
                      {selectedService.serviceParticipants.map(
                        (participant: any, index: number) => (
                          <li key={index}>
                            {participant.patient?.user?.first_name}{" "}
                            {participant.patient?.user?.last_name}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assessment Results Modal */}
      <Dialog open={assessmentModalOpen} onOpenChange={setAssessmentModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl">
              <FileText className="mr-2 h-6 w-6" />
              Initial Assessment Results
            </DialogTitle>
            <DialogDescription>
              Review the patient's initial psychological assessment scores and
              interpretation.
            </DialogDescription>
          </DialogHeader>
          {selectedAssessment ? (
            <div className="space-y-6 mt-4">
              {/* Patient Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Patient Information</h3>
                <p className="text-sm">
                  <strong>Name:</strong>{" "}
                  {selectedAssessment.patient?.user?.first_name}{" "}
                  {selectedAssessment.patient?.user?.last_name}
                </p>
                <p className="text-sm">
                  <strong>Submission Date:</strong>{" "}
                  {new Date(
                    selectedAssessment.submission_date
                  ).toLocaleDateString()}
                </p>
              </div>

              {/* Check if assessment data exists */}
              {selectedAssessment.data?.totalScore ? (
                <>
                  {/* Overall Score */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-lg mb-2">
                        Total Score
                      </h3>
                      <div className="text-3xl font-bold text-blue-600">
                        {selectedAssessment.data.totalScore} / 102
                      </div>
                      <Badge
                        className={
                          getScoreInterpretation(
                            selectedAssessment.data.totalScore,
                            102
                          ).color
                        }
                      >
                        {
                          getScoreInterpretation(
                            selectedAssessment.data.totalScore,
                            102
                          ).level
                        }
                      </Badge>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-lg mb-2">
                        Assessment Status
                      </h3>
                      <Badge className="bg-green-100 text-green-800">
                        Completed
                      </Badge>
                    </div>
                  </div>

                  {/* Detailed Scores */}
                  {selectedAssessment.data.scores && (
                    <div>
                      <h3 className="font-semibold text-lg mb-4">
                        Detailed Scores
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border p-4 rounded-lg">
                          <h4 className="font-medium mb-2">
                            Anxious Experiences
                          </h4>
                          <div className="text-2xl font-bold mb-2">
                            {selectedAssessment.data.scores
                              .anxious_experiences || 0}{" "}
                            / 21
                          </div>
                          <Badge
                            className={
                              getScoreInterpretation(
                                selectedAssessment.data.scores
                                  .anxious_experiences || 0,
                                21
                              ).color
                            }
                          >
                            {
                              getScoreInterpretation(
                                selectedAssessment.data.scores
                                  .anxious_experiences || 0,
                                21
                              ).level
                            }
                          </Badge>
                          <p className="text-xs text-gray-600 mt-2">
                            General anxious states and experiences
                          </p>
                        </div>

                        <div className="border p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Anxious Thoughts</h4>
                          <div className="text-2xl font-bold mb-2">
                            {selectedAssessment.data.scores.anxious_thoughts ||
                              0}{" "}
                            / 33
                          </div>
                          <Badge
                            className={
                              getScoreInterpretation(
                                selectedAssessment.data.scores
                                  .anxious_thoughts || 0,
                                33
                              ).color
                            }
                          >
                            {
                              getScoreInterpretation(
                                selectedAssessment.data.scores
                                  .anxious_thoughts || 0,
                                33
                              ).level
                            }
                          </Badge>
                          <p className="text-xs text-gray-600 mt-2">
                            Anxious thoughts and concerns
                          </p>
                        </div>

                        <div className="border p-4 rounded-lg">
                          <h4 className="font-medium mb-2">
                            Psychosomatic Symptoms
                          </h4>
                          <div className="text-2xl font-bold mb-2">
                            {selectedAssessment.data.scores
                              .psychosomatic_symptoms || 0}{" "}
                            / 48
                          </div>
                          <Badge
                            className={
                              getScoreInterpretation(
                                selectedAssessment.data.scores
                                  .psychosomatic_symptoms || 0,
                                48
                              ).color
                            }
                          >
                            {
                              getScoreInterpretation(
                                selectedAssessment.data.scores
                                  .psychosomatic_symptoms || 0,
                                48
                              ).level
                            }
                          </Badge>
                          <p className="text-xs text-gray-600 mt-2">
                            Physical manifestations of anxiety
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Interpretation */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Interpretation Guide</h3>
                    <div className="text-sm space-y-1">
                      <p>
                        • <strong>Low (0-25%):</strong> Minimal anxiety symptoms
                      </p>
                      <p>
                        • <strong>Moderate (25-50%):</strong> Moderate anxiety,
                        may need attention
                      </p>
                      <p>
                        • <strong>High (50-75%):</strong> High anxiety,
                        professional support recommended
                      </p>
                      <p>
                        • <strong>Very High (75-100%):</strong> Very high level,
                        specialized intervention needed
                      </p>
                    </div>
                  </div>

                  {/* Important Note */}
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-amber-800 mb-2">
                      Important Note
                    </h3>
                    <p className="text-sm text-amber-700">
                      These results represent a preliminary assessment and do
                      not constitute a medical diagnosis. For a complete
                      evaluation and personalized recommendations, please
                      discuss with your psychologist.
                    </p>
                  </div>
                </>
              ) : (
                /* No Assessment Data */
                <div className="text-center py-12">
                  <div className="bg-gray-50 rounded-lg p-8">
                    <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Assessment Not Taken
                    </h3>
                    <p className="text-gray-600 mb-4">
                      This patient has not completed their initial assessment
                      yet.
                    </p>
                    <Badge className="bg-gray-100 text-gray-800">
                      Not Taken
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-50 rounded-lg p-8">
                <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Assessment Not Taken
                </h3>
                <p className="text-gray-600 mb-4">
                  No assessment results available for this patient.
                </p>
                <Badge className="bg-gray-100 text-gray-800">Not Taken</Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
