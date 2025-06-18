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

export default function ProvideFeedback() {
  const { id: serviceIdParam } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Available services for feedback (if no serviceId is provided in URL)
  const [services, setServices] = useState<ServiceWithDoctor[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");

  // Current service details (if serviceId is provided in URL)
  const [currentService, setCurrentService] =
    useState<ServiceWithDoctor | null>(null);

  // Which type of feedback is being provided
  const [feedbackTarget, setFeedbackTarget] =
    useState<FeedbackTarget>("doctor");

  // Form data
  const [formData, setFormData] = useState({
    rating_score: "",
    comments: "",
    is_anonymous: false,
    feedback_target: "doctor" as FeedbackTarget,
    clinic_specific_feedback: "",
    doctor_specific_feedback: "",
    environment_rating: "",
    staff_rating: "",
    accessibility_rating: "",
    process_rating: "",
  });

  // Fetch available services or specific service
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (serviceIdParam) {
          // If service ID is provided in URL, fetch that specific service
          const response = await api.get(`/services/${serviceIdParam}`);
          setCurrentService(response.data);
          setSelectedServiceId(serviceIdParam);
        } else if (user?.id) {
          // Otherwise fetch all services available for feedback
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedServiceId || !currentService) {
      setError("Please select a service");
      return;
    }

    if (!formData.rating_score) {
      setError("Please provide a rating");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Find the participant ID for the current user
      const participantId = currentService.serviceParticipants.find(
        (p) => p.patient.patient_id === user?.id
      )?.participant_id;

      if (!participantId) {
        setError("Participant information not found");
        return;
      }

      // Build comments based on target
      let comments = formData.comments;

      if (feedbackTarget === "doctor") {
        if (formData.doctor_specific_feedback) {
          comments +=
            "\n\nDoctor Specific Feedback: " +
            formData.doctor_specific_feedback;
        }
      } else {
        if (formData.clinic_specific_feedback) {
          comments +=
            "\n\nClinic Specific Feedback: " +
            formData.clinic_specific_feedback;
        }

        comments += "\n\nRatings:";
        if (formData.environment_rating) {
          comments += "\nEnvironment: " + formData.environment_rating + "/5";
        }
        if (formData.staff_rating) {
          comments += "\nStaff: " + formData.staff_rating + "/5";
        }
        if (formData.accessibility_rating) {
          comments +=
            "\nAccessibility: " + formData.accessibility_rating + "/5";
        }
        if (formData.process_rating) {
          comments +=
            "\nAdministrative Process: " + formData.process_rating + "/5";
        }
      }

      // Submit feedback
      await api.post("/feedback", {
        service_id: selectedServiceId,
        participant_id: participantId,
        rating_score: parseInt(formData.rating_score),
        comments: comments,
        is_anonymous: formData.is_anonymous,
        feedback_target: feedbackTarget,
      });

      setSuccess("Thank you for your feedback!");

      // Reset form
      setFormData({
        rating_score: "",
        comments: "",
        is_anonymous: false,
        feedback_target: "doctor",
        clinic_specific_feedback: "",
        doctor_specific_feedback: "",
        environment_rating: "",
        staff_rating: "",
        accessibility_rating: "",
        process_rating: "",
      });

      // Navigate back after delay
      setTimeout(() => {
        navigate("/patient/dashboard");
      }, 2000);
    } catch (err: any) {
      console.error("Failed to submit feedback:", err);
      setError(err.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const handleServiceChange = (value: string) => {
    setSelectedServiceId(value);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingChange = (value: string) => {
    setFormData((prev) => ({ ...prev, rating_score: value }));
  };

  const handleSpecificRatingChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

  // Format date and time
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
            {/* Service Selection (only show if not provided in URL) */}
            {!serviceIdParam && (
              <div className="space-y-2">
                <Label htmlFor="service">Select Service</Label>
                <Select
                  value={selectedServiceId}
                  onValueChange={handleServiceChange}
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

            {/* Feedback Target Selection */}
            <div className="space-y-2">
              <Label>What would you like to provide feedback for?</Label>
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
                    Doctor
                  </TabsTrigger>
                  <TabsTrigger
                    value="clinic"
                    className="flex items-center gap-2"
                  >
                    <Building className="h-4 w-4" />
                    Clinic
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="doctor" className="mt-4">
                  {/* Doctor-specific feedback form */}
                  <div className="space-y-4">
                    {/* Overall Rating for Doctor */}
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

                    {/* General Comments for Doctor */}
                    <div className="space-y-2">
                      <Label htmlFor="comments">General Comments</Label>
                      <Textarea
                        id="comments"
                        name="comments"
                        placeholder="Share your general thoughts about the service"
                        value={formData.comments}
                        onChange={handleInputChange}
                        className="min-h-[80px]"
                      />
                    </div>

                    {/* Doctor-Specific Comments */}
                    <div className="space-y-2">
                      <Label htmlFor="doctor_specific_feedback">
                        Doctor-Specific Feedback
                      </Label>
                      <Textarea
                        id="doctor_specific_feedback"
                        name="doctor_specific_feedback"
                        placeholder="Share feedback about the doctor's professionalism, communication, expertise, etc."
                        value={formData.doctor_specific_feedback}
                        onChange={handleInputChange}
                        className="min-h-[120px]"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="clinic" className="mt-4">
                  {/* Clinic-specific feedback form */}
                  <div className="space-y-4">
                    {/* Overall Clinic Rating */}
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

                    {/* Specific Clinic Aspects Ratings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Environment Rating */}
                      <div className="space-y-2">
                        <Label htmlFor="environment_rating">
                          Environment & Facilities
                        </Label>
                        <Select
                          value={formData.environment_rating}
                          onValueChange={(value) =>
                            handleSpecificRatingChange(
                              "environment_rating",
                              value
                            )
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Rate clinic environment" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 - Poor</SelectItem>
                            <SelectItem value="2">2 - Fair</SelectItem>
                            <SelectItem value="3">3 - Good</SelectItem>
                            <SelectItem value="4">4 - Very Good</SelectItem>
                            <SelectItem value="5">5 - Excellent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Staff Rating */}
                      <div className="space-y-2">
                        <Label htmlFor="staff_rating">Support Staff</Label>
                        <Select
                          value={formData.staff_rating}
                          onValueChange={(value) =>
                            handleSpecificRatingChange("staff_rating", value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Rate support staff" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 - Poor</SelectItem>
                            <SelectItem value="2">2 - Fair</SelectItem>
                            <SelectItem value="3">3 - Good</SelectItem>
                            <SelectItem value="4">4 - Very Good</SelectItem>
                            <SelectItem value="5">5 - Excellent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Accessibility Rating */}
                      <div className="space-y-2">
                        <Label htmlFor="accessibility_rating">
                          Accessibility
                        </Label>
                        <Select
                          value={formData.accessibility_rating}
                          onValueChange={(value) =>
                            handleSpecificRatingChange(
                              "accessibility_rating",
                              value
                            )
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Rate accessibility" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 - Poor</SelectItem>
                            <SelectItem value="2">2 - Fair</SelectItem>
                            <SelectItem value="3">3 - Good</SelectItem>
                            <SelectItem value="4">4 - Very Good</SelectItem>
                            <SelectItem value="5">5 - Excellent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Administrative Process Rating */}
                      <div className="space-y-2">
                        <Label htmlFor="process_rating">
                          Administrative Process
                        </Label>
                        <Select
                          value={formData.process_rating}
                          onValueChange={(value) =>
                            handleSpecificRatingChange("process_rating", value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Rate administrative process" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 - Poor</SelectItem>
                            <SelectItem value="2">2 - Fair</SelectItem>
                            <SelectItem value="3">3 - Good</SelectItem>
                            <SelectItem value="4">4 - Very Good</SelectItem>
                            <SelectItem value="5">5 - Excellent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* General Comments for Clinic */}
                    <div className="space-y-2">
                      <Label htmlFor="comments">General Comments</Label>
                      <Textarea
                        id="comments"
                        name="comments"
                        placeholder="Share your general thoughts about the clinic"
                        value={formData.comments}
                        onChange={handleInputChange}
                        className="min-h-[80px]"
                      />
                    </div>

                    {/* Clinic-Specific Comments */}
                    <div className="space-y-2">
                      <Label htmlFor="clinic_specific_feedback">
                        Clinic-Specific Feedback
                      </Label>
                      <Textarea
                        id="clinic_specific_feedback"
                        name="clinic_specific_feedback"
                        placeholder="Share feedback about the clinic facilities, staff, processes, etc."
                        value={formData.clinic_specific_feedback}
                        onChange={handleInputChange}
                        className="min-h-[120px]"
                      />
                    </div>
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
              <Button type="submit" disabled={submitting || !currentService}>
                {submitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
