import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export default function AddServiceForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const [formData, setFormData] = useState({
    service_type: "",
    description: "",
    doctor_id: "",
    start_time: "",
    end_time: "",
    duration_minutes: 60,
    max_participants: 1,
    is_group: false,
    location: "",
    price: 0,
    recurring: false,
    frequency: "NONE", // NONE, DAILY, WEEKLY, MONTHLY
  });

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        // Use the existing employees endpoint
        const response = await api.get("/employees");

        // Filter to only get employees with doctor role
        const doctorEmployees = response.data.filter(
          (employee) =>
            employee.user.userRoles?.some(
              (role) => role.role.role_name === "doctor"
            ) && employee.user.is_active === true
        );

        // Map to the expected doctor format
        const mappedDoctors = doctorEmployees.map((employee) => {
          return {
            doctor_id: employee.doctor?.doctor_id || employee.employee_id,
            employee: {
              user: {
                first_name: employee.user.first_name,
                last_name: employee.user.last_name,
              },
            },
            specialization: employee.doctor?.specialization || null,
          };
        });

        setDoctors(mappedDoctors);
        console.log("Mapped doctors:", mappedDoctors); // Debugging
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
        setError("Failed to load doctors. Please try again later.");
      } finally {
        setLoadingDoctors(false);
      }
    };

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
    } else if (
      name === "price" ||
      name === "duration_minutes" ||
      name === "max_participants"
    ) {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (
      !formData.service_type ||
      !formData.doctor_id ||
      !formData.start_time ||
      !formData.end_time
    ) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await api.post("/services", formData);
      setSuccess("Service created successfully!");

      // Navigate away after a delay
      setTimeout(() => {
        navigate("/admin/services");
      }, 2000);
    } catch (err: unknown) {
      console.error("Failed to create service:", err);
      setError("Failed to create service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Create New Service</h1>
        <Button variant="outline" onClick={() => navigate("/admin/services")}>
          Back to Services
        </Button>
      </div>

      {error && <ApiErrorDisplay error={error} />}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline"> {success}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Service Details</CardTitle>
          <CardDescription>Create a new service in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>

                <div>
                  <Label htmlFor="service_type">Service Type *</Label>
                  <Input
                    id="service_type"
                    name="service_type"
                    value={formData.service_type}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Psychological Assessment, Therapy Session"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the service..."
                  />
                </div>

                <div>
                  <Label htmlFor="doctor_id">Assigned Doctor *</Label>
                  {loadingDoctors ? (
                    <p className="text-sm text-gray-500">Loading doctors...</p>
                  ) : (
                    <Select
                      name="doctor_id"
                      value={formData.doctor_id}
                      onValueChange={(value) =>
                        handleSelectChange("doctor_id", value)
                      }
                    >
                      <SelectTrigger className="w-full">
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
                            {doctor.specialization &&
                              ` (${doctor.specialization})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Office A, Online, etc."
                  />
                </div>
              </div>

              {/* Schedule & Participation */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Schedule & Participation
                </h3>

                <div>
                  <Label htmlFor="start_time">Start Time *</Label>
                  <Input
                    id="start_time"
                    name="start_time"
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="end_time">End Time *</Label>
                  <Input
                    id="end_time"
                    name="end_time"
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                  <Input
                    id="duration_minutes"
                    name="duration_minutes"
                    type="number"
                    min={5}
                    value={formData.duration_minutes}
                    onChange={handleChange}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_group"
                    name="is_group"
                    checked={formData.is_group}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="is_group">Group Service</Label>
                </div>

                {formData.is_group && (
                  <div>
                    <Label htmlFor="max_participants">
                      Maximum Participants
                    </Label>
                    <Input
                      id="max_participants"
                      name="max_participants"
                      type="number"
                      min={2}
                      value={formData.max_participants}
                      onChange={handleChange}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="price">Price (EUR)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleChange}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="recurring"
                    name="recurring"
                    checked={formData.recurring}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="recurring">Recurring Service</Label>
                </div>

                {formData.recurring && (
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select
                      name="frequency"
                      value={formData.frequency}
                      onValueChange={(value) =>
                        handleSelectChange("frequency", value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/services")}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating Service..." : "Create Service"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
