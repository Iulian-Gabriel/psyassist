import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ArrowLeft, Calendar, User } from "lucide-react";
import { format, addMonths } from "date-fns";
import { toast } from "sonner";

interface Service {
  service_id: number;
  service_type: string;
  start_time: string;
  doctor: {
    employee: {
      user: {
        first_name: string;
        last_name: string;
      };
    };
  };
  serviceParticipants: Array<{
    participant_id: number;
    patient: {
      patient_id: number;
      user: {
        first_name: string;
        last_name: string;
      };
    };
  }>;
}

interface Patient {
  patient_id: number;
  user: {
    first_name: string;
    last_name: string;
  };
  serviceParticipants: Array<{
    participant_id: number;
  }>;
}

interface Notice {
  notice_id: number;
  service_id: number;
  participant_id: number;
  issue_date: string;
  unique_notice_number: string | null;
  expiry_date: string | null;
  reason_for_issuance: string | null;
  fitness_status: string | null;
  recommendations: string | null;
  attachment_path: string | null;
}

export default function NoticeForm() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null
  );
  const [participantOptions, setParticipantOptions] = useState<
    Array<{ id: number; name: string }>
  >([]);

  const [formData, setFormData] = useState({
    service_id: "",
    participant_id: "",
    issue_date: format(new Date(), "yyyy-MM-dd"),
    unique_notice_number: "",
    expiry_date: format(addMonths(new Date(), 12), "yyyy-MM-dd"), // Default 1 year validity
    reason_for_issuance: "",
    fitness_status: "Fit",
    recommendations: "",
    attachment_path: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch services and patients in parallel
        const [servicesResponse, patientsResponse] = await Promise.all([
          api.get("/notices/services/list"),
          api.get("/notices/patients/list"),
        ]);

        setServices(servicesResponse.data);
        setPatients(patientsResponse.data);

        // If in edit mode, fetch notice data
        if (isEditMode && id) {
          const noticeResponse = await api.get(`/notices/${id}`);
          const notice = noticeResponse.data;

          // Format dates for form inputs
          const formattedIssueDate = notice.issue_date
            ? format(new Date(notice.issue_date), "yyyy-MM-dd")
            : format(new Date(), "yyyy-MM-dd");

          const formattedExpiryDate = notice.expiry_date
            ? format(new Date(notice.expiry_date), "yyyy-MM-dd")
            : format(addMonths(new Date(), 12), "yyyy-MM-dd");

          setFormData({
            service_id: notice.service_id.toString(),
            participant_id: notice.participant_id.toString(),
            issue_date: formattedIssueDate,
            unique_notice_number: notice.unique_notice_number || "",
            expiry_date: formattedExpiryDate,
            reason_for_issuance: notice.reason_for_issuance || "",
            fitness_status: notice.fitness_status || "Fit",
            recommendations: notice.recommendations || "",
            attachment_path: notice.attachment_path || "",
          });

          // If we have a service_id, update the participant options
          if (notice.service_id) {
            const service = servicesResponse.data.find(
              (s: Service) => s.service_id === notice.service_id
            );

            if (service) {
              const participants = service.serviceParticipants.map(
                (participant) => ({
                  id: participant.participant_id,
                  name: `${participant.patient.user.first_name} ${participant.patient.user.last_name}`,
                })
              );

              setParticipantOptions(participants);
            }
          }
        } else {
          // In create mode, generate a unique notice number
          const numberResponse = await api.get("/notices/generate-number");
          setFormData((prev) => ({
            ...prev,
            unique_notice_number: numberResponse.data.noticeNumber,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load necessary data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // If service selection changed, update participant options
    if (name === "service_id") {
      const selectedService = services.find(
        (service) => service.service_id.toString() === value
      );

      if (selectedService) {
        const participants = selectedService.serviceParticipants.map(
          (participant) => ({
            id: participant.participant_id,
            name: `${participant.patient.user.first_name} ${participant.patient.user.last_name}`,
          })
        );

        setParticipantOptions(participants);
        // Reset participant selection
        setFormData((prev) => ({ ...prev, participant_id: "" }));
      }
    }
  };

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);

    // Reset service and participant selection
    setFormData((prev) => ({
      ...prev,
      service_id: "",
      participant_id: "",
    }));

    // Filter services for this patient
    if (patientId) {
      const patientServices = services.filter((service) =>
        service.serviceParticipants.some(
          (participant) =>
            participant.patient.patient_id.toString() === patientId
        )
      );

      if (patientServices.length === 0) {
        toast.error("No services found for this patient");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.service_id || !formData.participant_id) {
      setError("Please select a service and patient");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        ...formData,
        service_id: parseInt(formData.service_id),
        participant_id: parseInt(formData.participant_id),
        issue_date: new Date(formData.issue_date).toISOString(),
        expiry_date: formData.expiry_date
          ? new Date(formData.expiry_date).toISOString()
          : null,
      };

      if (isEditMode) {
        await api.put(`/notices/${id}`, payload);
        toast.success("Medical notice updated successfully");
      } else {
        await api.post("/notices", payload);
        toast.success("Medical notice created successfully");
      }

      // Navigate back to notices list after successful submission
      navigate("/doctor/notices");
    } catch (err) {
      console.error("Failed to save notice:", err);
      setError("Failed to save medical notice. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/doctor/notices");
  };

  const getPatientServicesOptions = () => {
    if (!selectedPatientId) {
      return services;
    }

    return services.filter((service) =>
      service.serviceParticipants.some(
        (participant) =>
          participant.patient.patient_id.toString() === selectedPatientId
      )
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {isEditMode ? "Edit Medical Notice" : "Create Medical Notice"}
        </h1>
        <Button variant="outline" onClick={handleCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Notices
        </Button>
      </div>

      {error && <ApiErrorDisplay error={error} className="mb-6" />}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Left column */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the basic details for this medical notice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Patient</Label>
                <Select
                  value={selectedPatientId || ""}
                  onValueChange={(value) => handleSelectPatient(value)}
                  disabled={isEditMode || submitting}
                >
                  <SelectTrigger id="patient">
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

              <div className="space-y-2">
                <Label htmlFor="service_id">Service</Label>
                <Select
                  value={formData.service_id}
                  onValueChange={(value) =>
                    handleSelectChange("service_id", value)
                  }
                  disabled={isEditMode || submitting}
                >
                  <SelectTrigger id="service_id">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {getPatientServicesOptions().map((service) => (
                      <SelectItem
                        key={service.service_id}
                        value={service.service_id.toString()}
                      >
                        {service.service_type} -{" "}
                        {format(new Date(service.start_time), "MMM dd, yyyy")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="participant_id">Patient Participant</Label>
                <Select
                  value={formData.participant_id}
                  onValueChange={(value) =>
                    handleSelectChange("participant_id", value)
                  }
                  disabled={
                    participantOptions.length === 0 || isEditMode || submitting
                  }
                >
                  <SelectTrigger id="participant_id">
                    <SelectValue placeholder="Select a participant" />
                  </SelectTrigger>
                  <SelectContent>
                    {participantOptions.map((participant) => (
                      <SelectItem
                        key={participant.id}
                        value={participant.id.toString()}
                      >
                        {participant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unique_notice_number">Notice Number</Label>
                <Input
                  id="unique_notice_number"
                  name="unique_notice_number"
                  value={formData.unique_notice_number}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="issue_date">Issue Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="issue_date"
                    name="issue_date"
                    type="date"
                    value={formData.issue_date}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="expiry_date"
                    name="expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={submitting}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right column */}
          <Card>
            <CardHeader>
              <CardTitle>Medical Information</CardTitle>
              <CardDescription>
                Enter the medical details for this notice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason_for_issuance">Reason for Issuance</Label>
                <Input
                  id="reason_for_issuance"
                  name="reason_for_issuance"
                  value={formData.reason_for_issuance}
                  onChange={handleChange}
                  disabled={submitting}
                  placeholder="e.g., Employment, Driving License, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fitness_status">Fitness Status</Label>
                <Select
                  value={formData.fitness_status}
                  onValueChange={(value) =>
                    handleSelectChange("fitness_status", value)
                  }
                  disabled={submitting}
                >
                  <SelectTrigger id="fitness_status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fit">Fit</SelectItem>
                    <SelectItem value="Fit with Limitations">
                      Fit with Limitations
                    </SelectItem>
                    <SelectItem value="Temporarily Unfit">
                      Temporarily Unfit
                    </SelectItem>
                    <SelectItem value="Unfit">Unfit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recommendations">Recommendations</Label>
                <Textarea
                  id="recommendations"
                  name="recommendations"
                  value={formData.recommendations}
                  onChange={handleChange}
                  rows={6}
                  disabled={submitting}
                  placeholder="Enter medical recommendations, restrictions, or follow-up instructions..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardFooter className="flex justify-end gap-2 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Saving..."
                : isEditMode
                ? "Update Notice"
                : "Create Notice"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
