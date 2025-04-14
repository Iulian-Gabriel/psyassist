import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/services/api";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";

interface UserFormData {
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
  userRoles?: { role: { role_id: number; role_name: string } }[];
}

interface Role {
  role_id: number;
  role_name: string;
  description: string;
}

export default function EditUserForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [userData, setUserData] = useState<UserFormData>({
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
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/users/${id}`);

        // Format date to YYYY-MM-DD for input
        const formattedDate = response.data.date_of_birth
          ? new Date(response.data.date_of_birth).toISOString().split("T")[0]
          : "";

        // Extract current role IDs
        const userRoleIds = response.data.userRoles
          ? response.data.userRoles.map(
              (ur: { role: { role_id: number } }) => ur.role.role_id
            )
          : [];

        setSelectedRoles(userRoleIds);

        setUserData({
          ...response.data,
          date_of_birth: formattedDate,
        });
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setError("Failed to load user data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUser();
    }
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      await api.put(`/users/${id}`, {
        ...userData,
        roles: selectedRoles,
      });

      setSuccess("User updated successfully!");

      // Navigate back after a delay
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } catch (err: unknown) {
      setError(
        err instanceof AxiosError
          ? err.response?.data?.message || "Failed to update user."
          : "Failed to update user. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center">
        <p>Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Edit User</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Back
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
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Personal Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    value={userData.email}
                    onChange={handleChange}
                    disabled={saving}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={userData.first_name}
                    onChange={handleChange}
                    disabled={saving}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={userData.last_name}
                    onChange={handleChange}
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
                    value={userData.date_of_birth}
                    onChange={handleChange}
                    disabled={saving}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    name="gender"
                    value={userData.gender || "unspecified"}
                    onChange={handleChange}
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
                    value={userData.phone_number || ""}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address_street">Street Address</Label>
                  <Input
                    id="address_street"
                    name="address_street"
                    value={userData.address_street || ""}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="address_city">City</Label>
                  <Input
                    id="address_city"
                    name="address_city"
                    value={userData.address_city || ""}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="address_postal_code">Postal Code</Label>
                  <Input
                    id="address_postal_code"
                    name="address_postal_code"
                    value={userData.address_postal_code || ""}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="address_county">County</Label>
                  <Input
                    id="address_county"
                    name="address_county"
                    value={userData.address_county || ""}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="address_country">Country</Label>
                  <Input
                    id="address_country"
                    name="address_country"
                    value={userData.address_country || ""}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            {/* User Role */}
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
                onClick={() => navigate(-1)}
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
