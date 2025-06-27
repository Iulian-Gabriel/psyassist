import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";

interface ServiceType {
  service_type_id: number;
  name: string;
  description: string;
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

export default function RequestService() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const [formData, setFormData] = useState({
    service_type_id: "",
    preferred_doctor_id: "",
    preferred_date_1: "",
    preferred_date_2: "",
    preferred_date_3: "",
    preferred_time: "morning",
    reason: "",
    urgent: false,
    additional_notes: "",
  });

  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        // Placeholder - you'll need to implement this endpoint
        const response = await api.get("/service-types");
        setServiceTypes(response.data);
      } catch (err) {
        console.error("Failed to fetch service types:", err);
        setError("Failed to load service types. Please try again later.");
      }
    };

    const fetchDoctors = async () => {
      try {
        // Reuse your existing doctors endpoint
        const response = await api.get("/doctor/selection");
        setDoctors(response.data);
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
        setError("Failed to load doctors. Please try again later.");
      }
    };

    fetchServiceTypes();
    fetchDoctors();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (value: string) => {
    setFormData((prev) => ({ ...prev, preferred_time: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.service_type_id ||
      !formData.preferred_date_1 ||
      !formData.reason
    ) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Prepare the form data with proper type conversions
      const submitData = {
        service_type_id: parseInt(formData.service_type_id),
        preferred_doctor_id:
          formData.preferred_doctor_id &&
          formData.preferred_doctor_id !== "none"
            ? parseInt(formData.preferred_doctor_id)
            : undefined,
        preferred_date_1: formData.preferred_date_1,
        preferred_date_2: formData.preferred_date_2 || undefined,
        preferred_date_3: formData.preferred_date_3 || undefined,
        preferred_time: formData.preferred_time,
        reason: formData.reason,
        urgent: formData.urgent,
        additional_notes: formData.additional_notes || undefined,
      };

      // Submit the service request
      await api.post("/service-requests", submitData);

      setSuccess(
        "Your service request has been submitted successfully. We will contact you to confirm the appointment."
      );

      // Reset form after successful submission
      setFormData({
        service_type_id: "",
        preferred_doctor_id: "",
        preferred_date_1: "",
        preferred_date_2: "",
        preferred_date_3: "",
        preferred_time: "morning",
        reason: "",
        urgent: false,
        additional_notes: "",
      });

      // Navigate to dashboard after a delay
      setTimeout(() => {
        navigate("/patient/dashboard");
      }, 3000);
    } catch (err: any) {
      console.error("Failed to submit service request:", err);

      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to submit your request. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Request a Service</h1>
        <Button
          variant="outline"
          onClick={() => navigate("/patient/dashboard")}
        >
          Back to Dashboard
        </Button>
      </div>

      {error && <ApiErrorDisplay error={error} className="mb-4" />}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline"> {success}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Service Request Form</CardTitle>
          <CardDescription>
            Fill out this form to request an appointment with one of our
            specialists
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="service_type_id">Service Type *</Label>
                <Select
                  onValueChange={(value) =>
                    handleSelectChange("service_type_id", value)
                  }
                  value={formData.service_type_id}
                  disabled={loading}
                >
                  <SelectTrigger id="service_type_id">
                    <SelectValue placeholder="Select a service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((type) => (
                      <SelectItem
                        key={type.service_type_id}
                        value={String(type.service_type_id)}
                      >
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="preferred_doctor_id">
                  Preferred Doctor (Optional)
                </Label>
                <Select
                  onValueChange={(value) =>
                    handleSelectChange("preferred_doctor_id", value)
                  }
                  value={formData.preferred_doctor_id}
                  disabled={loading}
                >
                  <SelectTrigger id="preferred_doctor_id">
                    <SelectValue placeholder="Select a doctor (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No preference</SelectItem>
                    {doctors.map((doctor) => (
                      <SelectItem
                        key={doctor.doctor_id}
                        value={String(doctor.doctor_id)}
                      >
                        Dr. {doctor.employee.user.first_name}{" "}
                        {doctor.employee.user.last_name}
                        {doctor.specialization && ` (${doctor.specialization})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preferred_date_1">
                    Preferred Date (1st Choice) *
                  </Label>
                  <Input
                    id="preferred_date_1"
                    name="preferred_date_1"
                    type="date"
                    value={formData.preferred_date_1}
                    onChange={handleChange}
                    min={new Date().toISOString().split("T")[0]}
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="preferred_time">Preferred Time *</Label>
                  <RadioGroup
                    value={formData.preferred_time}
                    onValueChange={handleRadioChange}
                    disabled={loading}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="morning" id="morning" />
                      <Label htmlFor="morning">Morning</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="afternoon" id="afternoon" />
                      <Label htmlFor="afternoon">Afternoon</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="evening" id="evening" />
                      <Label htmlFor="evening">Evening</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preferred_date_2">
                    Alternative Date (2nd Choice)
                  </Label>
                  <Input
                    id="preferred_date_2"
                    name="preferred_date_2"
                    type="date"
                    value={formData.preferred_date_2}
                    onChange={handleChange}
                    min={new Date().toISOString().split("T")[0]}
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="preferred_date_3">
                    Alternative Date (3rd Choice)
                  </Label>
                  <Input
                    id="preferred_date_3"
                    name="preferred_date_3"
                    type="date"
                    value={formData.preferred_date_3}
                    onChange={handleChange}
                    min={new Date().toISOString().split("T")[0]}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Request *</Label>
                <Textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Please describe the reason for your appointment request"
                  disabled={loading}
                  required
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="urgent"
                  name="urgent"
                  checked={formData.urgent}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, urgent: !!checked }))
                  }
                  disabled={loading}
                />
                <Label htmlFor="urgent" className="font-medium text-red-600">
                  This is an urgent request
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional_notes">
                  Additional Notes (Optional)
                </Label>
                <Textarea
                  id="additional_notes"
                  name="additional_notes"
                  value={formData.additional_notes}
                  onChange={handleChange}
                  placeholder="Any additional information that might be helpful"
                  disabled={loading}
                  rows={3}
                />
              </div>
            </div>

            <div className="space-x-2 flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/patient/dashboard")}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
