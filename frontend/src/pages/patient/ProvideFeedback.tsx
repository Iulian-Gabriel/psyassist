import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

// UI Components
import { Button } from "../../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Checkbox } from "../../components/ui/checkbox";
import ApiErrorDisplay from "../../components/ui/ApiErrorDisplay";
import {
  ArrowLeft,
  Star,
  Calendar,
  Clock,
  User,
  Clock3,
  Building,
  UserRound,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";

// Make sure your FeedbackTargetType enum is available or define it:
enum FeedbackTargetType {
  DOCTOR = "DOCTOR",
  SERVICE = "SERVICE", // In your schema, SERVICE is used for clinic/general service feedback
}

interface ServiceWithDoctor {
  service_id: number;
  service_type: string;
  start_time: string;
  end_time: string;
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

type FeedbackTarget = "doctor" | "clinic";

// Define only the four specified clinic feedback attributes and their corresponding boolean field names
const CLINIC_ATTRIBUTES = [
  { label: "Clean Facilities", field: "is_clean_facilities" },
  { label: "Friendly Staff", field: "is_friendly_staff" },
  { label: "Easy Accessibility", field: "is_easy_accessibility" },
  { label: "Smooth Administrative Process", field: "is_smooth_admin_process" },
];

export default function ProvideFeedback() {
  const { id: serviceIdParam } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [services, setServices] = useState<ServiceWithDoctor[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [currentService, setCurrentService] =
    useState<ServiceWithDoctor | null>(null);

  const [feedbackTarget, setFeedbackTarget] =
    useState<FeedbackTarget>("doctor");

  const [feedbackType, setFeedbackType] = useState<"service" | "general">(
    "service"
  );

  // Updated form data state with only the four specified boolean fields
  const [formData, setFormData] = useState({
    rating_score: "",
    comments: "", // General free-text comments (for doctor or clinic)
    is_anonymous: false,
    feedback_target: "doctor" as FeedbackTarget,
    doctor_specific_feedback: "", // Free-text specific to doctor
    clinic_specific_feedback: "", // Free-text specific to clinic
    // NEW: Only these four Boolean fields
    is_clean_facilities: false,
    is_friendly_staff: false,
    is_easy_accessibility: false,
    is_smooth_admin_process: false,
  });

  // Fetch available services or specific service
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (serviceIdParam) {
          const response = await api.get(`/services/${serviceIdParam}`);
          setCurrentService(response.data);
          setSelectedServiceId(serviceIdParam);
        } else if (user?.id) {
          const response = await api.get(
            `/feedback/services?patientId=${user.id}`
          );
          setServices(response.data);
        }
      } catch (err: any) {
        console.error("Error fetching services:", err);
        setError(err.message || "Failed to load services");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [serviceIdParam, user?.id]);

  // When a service is selected from dropdown
  useEffect(() => {
    if (!serviceIdParam && selectedServiceId) {
      const selected = services.find(
        (s) => s.service_id.toString() === selectedServiceId
      );
      setCurrentService(selected || null);
    }
  }, [selectedServiceId, services, serviceIdParam]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingChange = (value: string) => {
    setFormData((prev) => ({ ...prev, rating_score: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, is_anonymous: checked }));
  };

  const handleTabChange = (value: string) => {
    setFeedbackTarget(value as FeedbackTarget);
    setFormData((prev) => ({
      ...prev,
      feedback_target: value as FeedbackTarget,
    }));
  };

  // Handler for toggling clinic boolean attributes
  const handleClinicAttributeToggle = (field: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev], // Toggle boolean value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only require service selection for doctor feedback
    if (
      feedbackTarget === "doctor" &&
      (!selectedServiceId || !currentService)
    ) {
      setError("Please select a service");
      return;
    }

    if (!formData.rating_score) {
      setError("Please provide an overall rating");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      let response;

      if (feedbackTarget === "clinic" && !selectedServiceId) {
        // General clinic feedback (without service selection)
        const payload = {
          patient_id: user?.id,
          rating_score: formData.rating_score,
          comments: formData.comments,
          is_anonymous: formData.is_anonymous,
        };

        // Add clinic attributes
        CLINIC_ATTRIBUTES.forEach((attr) => {
          payload[attr.field] = formData[attr.field as keyof typeof formData];
        });

        response = await api.post("/feedback/general-clinic", payload);
      } else {
        // Service-specific feedback (existing code)
        const patientParticipant = currentService.serviceParticipants.find(
          (p) => p.patient.patient_id === user?.id
        );

        if (!patientParticipant) {
          setError("Participant information not found for the current user.");
          return;
        }
        const participantId = patientParticipant.participant_id;

        // Existing code for service-specific feedback
        const payload = {
          service_id: selectedServiceId,
          participant_id: participantId,
          rating_score: parseInt(formData.rating_score),
          comments: formData.comments || null,
          is_anonymous: formData.is_anonymous,
          feedback_target: feedbackTarget,
        };

        // Add clinic fields if needed
        if (feedbackTarget === "clinic") {
          CLINIC_ATTRIBUTES.forEach((attr) => {
            payload[attr.field] = formData[attr.field as keyof typeof formData];
          });
        }

        response = await api.post("/feedback", payload);
      }

      setSuccess("Thank you for your feedback!");

      // Reset form to its initial state (only the four specified boolean fields)
      setFormData({
        rating_score: "",
        comments: "",
        is_anonymous: false,
        feedback_target: "doctor",
        doctor_specific_feedback: "",
        clinic_specific_feedback: "",
        // Reset NEW Boolean fields
        is_clean_facilities: false,
        is_friendly_staff: false,
        is_easy_accessibility: false,
        is_smooth_admin_process: false,
      });

      setTimeout(() => {
        navigate("/patient/dashboard");
      }, 2000);
    } catch (err: any) {
      console.error("Failed to submit feedback:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to submit feedback"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
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
        <h1 className="text-3xl font-bold">Provide Feedback</h1>
        <Button
          variant="outline"
          onClick={() => navigate("/patient/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      {error && <ApiErrorDisplay error={error} className="mb-6" />}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline"> {success}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Service Feedback</CardTitle>
          <CardDescription>
            Please share your experience with this psychological service
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* One simple choice at the top: Doctor or Clinic feedback */}
            <div className="space-y-2">
              <Label>What would you like to provide feedback about?</Label>
              <Tabs
                value={feedbackTarget}
                onValueChange={handleTabChange}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="doctor"
                    className="flex items-center gap-2"
                  >
                    <UserRound className="h-4 w-4" />
                    Doctor Performance
                  </TabsTrigger>
                  <TabsTrigger
                    value="clinic"
                    className="flex items-center gap-2"
                  >
                    <Building className="h-4 w-4" />
                    Clinic Experience
                  </TabsTrigger>
                </TabsList>

                {/* Doctor Feedback Form */}
                <TabsContent value="doctor" className="mt-4">
                  {/* Service Selection (if not provided in URL) */}
                  {!serviceIdParam && (
                    <div className="space-y-2 mb-4">
                      <Label htmlFor="service">
                        Select Service with Doctor
                      </Label>
                      <Select
                        value={selectedServiceId}
                        onValueChange={setSelectedServiceId}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.length > 0 ? (
                            services.map((service) => (
                              <SelectItem
                                key={service.service_id}
                                value={service.service_id.toString()}
                              >
                                {service.service_type} with Dr.{" "}
                                {service.doctor.employee.user.last_name} (
                                {formatDate(service.start_time)})
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-services" disabled>
                              No services available for feedback
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Service Details */}
                  {currentService && (
                    <div className="bg-muted p-4 rounded-md space-y-2 mb-4">
                      <h3 className="font-medium text-lg">
                        {currentService.service_type}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>
                            Dr. {currentService.doctor.employee.user.first_name}{" "}
                            {currentService.doctor.employee.user.last_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(currentService.start_time)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{formatTime(currentService.start_time)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-muted-foreground" />
                          <span>{formatTime(currentService.end_time)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Doctor Rating */}
                  <div className="space-y-2">
                    <Label htmlFor="rating">Doctor Rating (1-5 stars)</Label>
                    <Select
                      value={formData.rating_score}
                      onValueChange={handleRatingChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Rate doctor's service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <span>1 - Poor</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="2">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <span>2 - Fair</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="3">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <span>3 - Good</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="4">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <span>4 - Very Good</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="5">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <span>5 - Excellent</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Doctor Comments */}
                  <div className="space-y-2">
                    <Label htmlFor="comments">Comments about the Doctor</Label>
                    <Textarea
                      id="comments"
                      name="comments"
                      placeholder="Share your thoughts about your experience with this doctor."
                      value={formData.comments}
                      onChange={handleInputChange}
                      className="min-h-[120px]"
                    />
                  </div>
                </TabsContent>

                {/* Clinic Feedback Form */}
                <TabsContent value="clinic" className="mt-4">
                  {/* Clinic Rating */}
                  <div className="space-y-2">
                    <Label htmlFor="rating">
                      Overall Clinic Rating (1-5 stars)
                    </Label>
                    <Select
                      value={formData.rating_score}
                      onValueChange={handleRatingChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Rate the clinic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <span>1 - Poor</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="2">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <span>2 - Fair</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="3">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <span>3 - Good</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="4">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <span>4 - Very Good</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="5">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <Star className="h-4 w-4 fill-current text-yellow-400 mr-1" />
                            <span>5 - Excellent</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Clinic Attributes Tags */}
                  <div className="space-y-2">
                    <Label>
                      What best describes your clinic experience? (Select all
                      that apply)
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {CLINIC_ATTRIBUTES.map((attr) => (
                        <Button
                          key={attr.field}
                          type="button"
                          variant={
                            formData[attr.field as keyof typeof formData]
                              ? "default"
                              : "outline"
                          }
                          onClick={() =>
                            handleClinicAttributeToggle(attr.field)
                          }
                        >
                          {attr.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Clinic Comments */}
                  <div className="space-y-2">
                    <Label htmlFor="comments">Additional Comments</Label>
                    <Textarea
                      id="comments"
                      name="comments"
                      placeholder="Share your thoughts about our clinic, facilities, and services."
                      value={formData.comments}
                      onChange={handleInputChange}
                      className="min-h-[120px]"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Anonymous Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_anonymous"
                checked={formData.is_anonymous}
                onCheckedChange={handleCheckboxChange}
              />
              <Label htmlFor="is_anonymous">Submit feedback anonymously</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/patient/dashboard")}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  submitting || (feedbackTarget === "doctor" && !currentService)
                }
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
