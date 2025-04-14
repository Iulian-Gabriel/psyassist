import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";

interface EmployeeFormData {
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
  job_title: string;
  hire_date: string;
  doctor?: {
    specialization?: string;
    bio?: string;
  } | null;
}

interface Role {
  role_id: number;
  role_name: string;
}

export default function EditEmployeeForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [employeeData, setEmployeeData] = useState<EmployeeFormData>({
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
    job_title: "",
    hire_date: "",
    doctor: null,
  });
  const [isDoctor, setIsDoctor] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

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
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/employees/${id}`);
        const employee = response.data;

        // Format dates
        const formattedUserDob = employee.user.date_of_birth
          ? new Date(employee.user.date_of_birth).toISOString().split("T")[0]
          : "";

        const formattedHireDate = employee.hire_date
          ? new Date(employee.hire_date).toISOString().split("T")[0]
          : "";

        // Extract role IDs
        const userRoleIds = employee.user.userRoles
          ? employee.user.userRoles.map((ur) => ur.role.role_id)
          : [];

        setSelectedRoles(userRoleIds);

        setEmployeeData({
          ...employee,
          user: {
            ...employee.user,
            date_of_birth: formattedUserDob,
          },
          hire_date: formattedHireDate,
        });

        // Check if this employee is also a doctor
        setIsDoctor(!!employee.doctor);
      } catch (err) {
        console.error("Failed to fetch employee:", err);
        setError("Failed to load employee data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEmployee();
    }
  }, [id]);

  const handleUserChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setEmployeeData((prev) => ({
      ...prev,
      user: { ...prev.user, [name]: value },
    }));
  };

  const handleEmployeeChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEmployeeData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDoctorChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEmployeeData((prev) => ({
      ...prev,
      doctor: {
        ...prev.doctor,
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      // Update employee information including roles
      await api.put(`/employees/${id}`, {
        user: {
          email: employeeData.user.email,
          first_name: employeeData.user.first_name,
          last_name: employeeData.user.last_name,
          phone_number: employeeData.user.phone_number,
          date_of_birth: employeeData.user.date_of_birth,
          gender: employeeData.user.gender,
          address_street: employeeData.user.address_street,
          address_city: employeeData.user.address_city,
          address_postal_code: employeeData.user.address_postal_code,
          address_country: employeeData.user.address_country,
          address_county: employeeData.user.address_county,
          roles: selectedRoles,
        },
        job_title: employeeData.job_title,
        hire_date: employeeData.hire_date,
      });

      // If the employee is a doctor, update doctor-specific information
      if (isDoctor && employeeData.doctor) {
        await api.put(`/doctors/${id}`, {
          specialization: employeeData.doctor.specialization,
          bio: employeeData.doctor.bio,
        });
      }

      setSuccess("Employee updated successfully!");

      // Navigate back after a delay
      setTimeout(() => {
        navigate("/admin/employees");
      }, 1500);
    } catch (err: unknown) {
      console.error("Failed to update employee:", err);
      setError(
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
          : "Failed to update employee. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center">
        <p>Loading employee data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Edit Employee</h1>
        <Button variant="outline" onClick={() => navigate("/admin/employees")}>
          Back to Employees
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
          <CardTitle>Employee Information</CardTitle>
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
                    value={employeeData.user.email}
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
                    value={employeeData.user.first_name}
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
                    value={employeeData.user.last_name}
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
                    value={employeeData.user.date_of_birth}
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
                    value={employeeData.user.gender || "unspecified"}
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
                    value={employeeData.user.phone_number || ""}
                    onChange={handleUserChange}
                    disabled={saving}
                    required
                  />
                </div>

                {/* Employee Information */}
                <div>
                  <Label htmlFor="job_title">Job Title</Label>
                  <Input
                    id="job_title"
                    name="job_title"
                    value={employeeData.job_title}
                    onChange={handleEmployeeChange}
                    disabled={saving}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="hire_date">Hire Date</Label>
                  <Input
                    id="hire_date"
                    name="hire_date"
                    type="date"
                    value={employeeData.hire_date}
                    onChange={handleEmployeeChange}
                    disabled={saving}
                    required
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
                    value={employeeData.user.address_street || ""}
                    onChange={handleUserChange}
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="address_city">City</Label>
                  <Input
                    id="address_city"
                    name="address_city"
                    value={employeeData.user.address_city || ""}
                    onChange={handleUserChange}
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="address_postal_code">Postal Code</Label>
                  <Input
                    id="address_postal_code"
                    name="address_postal_code"
                    value={employeeData.user.address_postal_code || ""}
                    onChange={handleUserChange}
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="address_county">County</Label>
                  <Input
                    id="address_county"
                    name="address_county"
                    value={employeeData.user.address_county || ""}
                    onChange={handleUserChange}
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="address_country">Country</Label>
                  <Input
                    id="address_country"
                    name="address_country"
                    value={employeeData.user.address_country || ""}
                    onChange={handleUserChange}
                    disabled={saving}
                  />
                </div>

                {/* Doctor-specific fields */}
                {isDoctor && (
                  <>
                    <div>
                      <Label htmlFor="specialization">Specialization</Label>
                      <Input
                        id="specialization"
                        name="specialization"
                        value={employeeData.doctor?.specialization || ""}
                        onChange={handleDoctorChange}
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={employeeData.doctor?.bio || ""}
                        onChange={handleDoctorChange}
                        disabled={saving}
                        className="h-24"
                      />
                    </div>
                  </>
                )}
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

                    // Special handling for doctor role
                    if (roleId) {
                      const selectedRole = availableRoles.find(
                        (r) => r.role_id === roleId
                      );
                      setIsDoctor(selectedRole?.role_name === "doctor");
                    } else {
                      setIsDoctor(false);
                    }

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

              {/* Only show doctor fields if the doctor role is selected */}
              {isDoctor && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  <h4 className="font-medium">Doctor Details</h4>

                  <div>
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      name="specialization"
                      value={employeeData.doctor?.specialization || ""}
                      onChange={(e) => {
                        setEmployeeData((prev) => ({
                          ...prev,
                          doctor: {
                            ...prev.doctor,
                            specialization: e.target.value,
                          },
                        }));
                      }}
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={employeeData.doctor?.bio || ""}
                      onChange={(e) => {
                        setEmployeeData((prev) => ({
                          ...prev,
                          doctor: {
                            ...prev.doctor,
                            bio: e.target.value,
                          },
                        }));
                      }}
                      disabled={saving}
                      className="h-24"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/employees")}
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
