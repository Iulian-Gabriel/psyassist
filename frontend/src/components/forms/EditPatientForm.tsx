import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";

interface PatientFormData {
  user: {
    email: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    date_of_birth: string;
    gender?: string;
    address_street?: string;
    address_city?: string;
    address_postal_code?: string;
    address_country?: string;
    address_county?: string;
  };
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

interface Role {
  role_id: number;
  role_name: string;
  description: string;
}

export default function EditPatientForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

  const [patientData, setPatientData] = useState<PatientFormData>({
    user: {
      email: "",
      first_name: "",
      last_name: "",
      phone_number: "",
      date_of_birth: "",
      gender: "unspecified",
      address_street: "",
      address_city: "",
      address_postal_code: "",
      address_country: "",
      address_county: "",
    },
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.get("/users/roles");
        setAvailableRoles(response.data);
      } catch (err) {
        console.error("Failed to fetch roles:", err);
      }
    };

    fetchRoles();
  }, []);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/patients/${id}`);
        const patient = response.data;

        // Format date
        const formattedUserDob = patient.user.date_of_birth
          ? new Date(patient.user.date_of_birth).toISOString().split("T")[0]
          : "";

        // Extract role IDs
        const userRoleIds = patient.user.userRoles
          ? patient.user.userRoles.map((ur) => ur.role.role_id)
          : [];

        setSelectedRoles(userRoleIds);

        setPatientData({
          ...patient,
          user: {
            ...patient.user,
            date_of_birth: formattedUserDob,
          },
        });
      } catch (err) {
        console.error("Failed to fetch patient:", err);
        setError("Failed to load patient data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPatient();
    }
  }, [id]);

  const handleUserChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setPatientData((prev) => ({
      ...prev,
      user: { ...prev.user, [name]: value },
    }));
  };

  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPatientData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      // Update patient information including roles
      await api.put(`/patients/${id}`, {
        user: {
          email: patientData.user.email,
          first_name: patientData.user.first_name,
          last_name: patientData.user.last_name,
          phone_number: patientData.user.phone_number,
          date_of_birth: patientData.user.date_of_birth,
          gender: patientData.user.gender,
          address_street: patientData.user.address_street,
          address_city: patientData.user.address_city,
          address_postal_code: patientData.user.address_postal_code,
          address_country: patientData.user.address_country,
          address_county: patientData.user.address_county,
          roles: selectedRoles,
        },
        emergency_contact_name: patientData.emergency_contact_name,
        emergency_contact_phone: patientData.emergency_contact_phone,
      });

      setSuccess("Patient updated successfully!");

      // Navigate back after a delay
      setTimeout(() => {
        navigate("/admin/patients");
      }, 1500);
    } catch (err: unknown) {
      console.error("Failed to update patient:", err);
      const errorMessage =
        err && typeof err === "object" && "response" in err
          ? (err.response as { data?: { message?: string } })?.data?.message ||
            "Failed to update patient. Please try again."
          : "Failed to update patient. Please try again.";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center">
        <p>Loading patient data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Edit Patient</h1>
        <Button variant="outline" onClick={() => navigate("/admin/patients")}>
          Back to Patients
        </Button>
      </div>

      {error && <ApiErrorDisplay error={error} />}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{success}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* User Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    value={patientData.user.email}
                    onChange={handleUserChange}
                    disabled={saving}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={patientData.user.first_name}
                    onChange={handleUserChange}
                    disabled={saving}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={patientData.user.last_name}
                    onChange={handleUserChange}
                    disabled={saving}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    value={patientData.user.date_of_birth}
                    onChange={handleUserChange}
                    disabled={saving}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    name="gender"
                    value={patientData.user.gender || "unspecified"}
                    onChange={handleUserChange}
                    disabled={saving}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="unspecified">Unspecified</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={patientData.user.phone_number || ""}
                    onChange={handleUserChange}
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Emergency Contact and Address */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="emergency_contact_name">
                    Emergency Contact Name
                  </Label>
                  <Input
                    id="emergency_contact_name"
                    name="emergency_contact_name"
                    value={patientData.emergency_contact_name || ""}
                    onChange={handlePatientChange}
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="emergency_contact_phone">
                    Emergency Contact Phone
                  </Label>
                  <Input
                    id="emergency_contact_phone"
                    name="emergency_contact_phone"
                    value={patientData.emergency_contact_phone || ""}
                    onChange={handlePatientChange}
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="address_street">Street Address</Label>
                  <Input
                    id="address_street"
                    name="address_street"
                    value={patientData.user.address_street || ""}
                    onChange={handleUserChange}
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="address_city">City</Label>
                  <Input
                    id="address_city"
                    name="address_city"
                    value={patientData.user.address_city || ""}
                    onChange={handleUserChange}
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="address_postal_code">Postal Code</Label>
                  <Input
                    id="address_postal_code"
                    name="address_postal_code"
                    value={patientData.user.address_postal_code || ""}
                    onChange={handleUserChange}
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="address_county">County</Label>
                  <Input
                    id="address_county"
                    name="address_county"
                    value={patientData.user.address_county || ""}
                    onChange={handleUserChange}
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="address_country">Country</Label>
                  <Input
                    id="address_country"
                    name="address_country"
                    value={patientData.user.address_country || ""}
                    onChange={handleUserChange}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6 mb-6">
              <h3 className="font-medium mb-4">User Role</h3>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="role">Select Role</Label>
                <select
                  id="role"
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={selectedRoles.length > 0 ? selectedRoles[0] : ""}
                  onChange={(e) => {
                    const roleId = parseInt(e.target.value);
                    setSelectedRoles(roleId ? [roleId] : []);
                  }}
                  disabled={saving}
                >
                  <option value="">Select a role</option>
                  {availableRoles.map((role) => (
                    <option key={role.role_id} value={role.role_id}>
                      {role.role_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/patients")}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
