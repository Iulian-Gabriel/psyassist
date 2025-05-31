import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ServiceType {
  id: string;
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
        const response = await api.get("/service-types");
        setServiceTypes(response.data);
      } catch (err) {
        console.error("Failed to fetch service types:", err);
        setError("Failed to load service types. Please try again later.");
      }
    };

    const fetchDoctors = async () => {
      try {
        const response = await api.get("/doctors");
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
    if (!formData.service_type_id || !formData.preferred_date_1) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Add the patient ID to the form data
      const submitData = {
        ...formData,
        patient_id: user?.id, // Assuming the user object has an 'id' property that corresponds to the patient ID
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
    } catch (err) {
      console.error("Failed to submit service request:", err);
      setError("Failed to submit your request. Please try again.");
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
            Please provide your preferences and we'll schedule your appointment
            as soon as possible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="service_type_id">Service Type *</Label>
                <Select
                  name="service_type_id"
                  value={formData.service_type_id}
                  onValueChange={(value) =>
                    handleSelectChange("service_type_id", value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
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
                  name="preferred_doctor_id"
                  value={formData.preferred_doctor_id}
                  onValueChange={(value) =>
                    handleSelectChange("preferred_doctor_id", value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="No preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No preference</SelectItem>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="preferred_date_1">Preferred Date 1 *</Label>
                  <Input
                    id="preferred_date_1"
                    name="preferred_date_1"
                    type="date"
                    value={formData.preferred_date_1}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="preferred_date_2">Preferred Date 2</Label>
                  <Input
                    id="preferred_date_2"
                    name="preferred_date_2"
                    type="date"
                    value={formData.preferred_date_2}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="preferred_date_3">Preferred Date 3</Label>
                  <Input
                    id="preferred_date_3"
                    name="preferred_date_3"
                    type="date"
                    value={formData.preferred_date_3}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <Label>Preferred Time of Day</Label>
                <RadioGroup
                  value={formData.preferred_time}
                  onValueChange={handleRadioChange}
                  className="flex flex-row space-x-4 mt-2"
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

              <div>
                <Label htmlFor="reason">Reason for Visit *</Label>
                <Textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Please describe why you're seeking this service"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="urgent"
                  name="urgent"
                  checked={formData.urgent}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="urgent">This is urgent (within 48 hours)</Label>
              </div>

              <div>
                <Label htmlFor="additional_notes">Additional Notes</Label>
                <Textarea
                  id="additional_notes"
                  name="additional_notes"
                  value={formData.additional_notes}
                  onChange={handleChange}
                  placeholder="Any other information you'd like us to know"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/patient/dashboard")}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting Request..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
