import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";

export default function AddPatientForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [errorStatusCode, setErrorStatusCode] = useState<number | undefined>(
    undefined
  );

  // Combined form data for patient
  const [formData, setFormData] = useState({
    // User data
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "unspecified",
    phone_number: "",
    address_street: "",
    address_city: "",
    address_postal_code: "",
    address_country: "",
    address_county: "",

    // Patient-specific data
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });

  // Validation functions
  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone.trim()) return false;

    // Basic phone validation - adjust the regex as needed for your requirements
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(phone.trim());
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (
      !formData.email ||
      !formData.password ||
      !formData.first_name ||
      !formData.last_name ||
      !formData.date_of_birth
    ) {
      setError("Please fill in all required fields");
      return;
    }

    // Validate phone number
    if (!validatePhoneNumber(formData.phone_number)) {
      setError(
        "Please enter a valid phone number (10-15 digits, may start with +)"
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create a copy of form data
      const formDataToSubmit = { ...formData };

      // Send request to patient creation endpoint
      await api.post("/patients", formDataToSubmit);

      setSuccess("Patient created successfully!");

      // Navigate away after a delay
      setTimeout(() => {
        navigate("/admin/patients");
      }, 2000);
    } catch (err: unknown) {
      console.error("Failed to create patient:", err);

      // Enhanced error handling
      let errorMessage = "Failed to create patient. Please try again.";

      if (err && typeof err === "object") {
        if ("response" in err) {
          const response = (
            err as {
              response: {
                status?: number;
                data?: { message?: string; field?: string };
              };
            }
          ).response;
          setErrorStatusCode(response?.status);

          if (response?.data?.message) {
            errorMessage = response.data.message;

            // Handle specific field errors
            if (response?.data?.field === "email") {
              errorMessage = "Email address is already in use.";
            } else if (response?.data?.field === "phone_number") {
              errorMessage = "Phone number is already in use.";
            }
          }
        } else if ("message" in err) {
          errorMessage = (err as Error).message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Add New Patient</h1>
        <Button variant="outline" onClick={() => navigate("/admin/patients")}>
          Back to Patients
        </Button>
      </div>

      {error && <ApiErrorDisplay error={error} statusCode={errorStatusCode} />}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline"> {success}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
          <CardDescription>
            Create a new patient account in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Personal Information</h3>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="date_of_birth">Date of Birth *</Label>
                  <Input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="unspecified">Unspecified</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="phone_number">Phone Number *</Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Emergency Contact and Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Emergency Contact & Address
                </h3>

                <div>
                  <Label htmlFor="emergency_contact_name">
                    Emergency Contact Name
                  </Label>
                  <Input
                    id="emergency_contact_name"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label htmlFor="emergency_contact_phone">
                    Emergency Contact Phone
                  </Label>
                  <Input
                    id="emergency_contact_phone"
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label htmlFor="address_street">Street Address</Label>
                  <Input
                    id="address_street"
                    name="address_street"
                    value={formData.address_street}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label htmlFor="address_city">City</Label>
                  <Input
                    id="address_city"
                    name="address_city"
                    value={formData.address_city}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label htmlFor="address_postal_code">Postal Code</Label>
                  <Input
                    id="address_postal_code"
                    name="address_postal_code"
                    value={formData.address_postal_code}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label htmlFor="address_county">County</Label>
                  <Input
                    id="address_county"
                    name="address_county"
                    value={formData.address_county}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label htmlFor="address_country">Country</Label>
                  <Input
                    id="address_country"
                    name="address_country"
                    value={formData.address_country}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/patients")}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating Patient..." : "Create Patient"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
