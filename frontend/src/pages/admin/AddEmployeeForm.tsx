import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";

export default function AddEmployeeForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [errorStatusCode, setErrorStatusCode] = useState<number | undefined>(
    undefined
  );

  // State for employee role selection
  const [selectedRole, setSelectedRole] = useState<
    "admin" | "doctor" | "receptionist"
  >("admin");

  // Combined form data for all employee types
  const [formData, setFormData] = useState({
    // User data (common for all employees)
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

    // Employee data (common for all employees)
    job_title: "",

    // Doctor-specific data
    specialization: "",
    bio: "",
  });

  // Validation functions
  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone.trim()) return false; // Empty is NOT OK now

    // Basic phone validation - adjust the regex as needed for your requirements
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(phone.trim());
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(e.target.value as "admin" | "doctor" | "receptionist");
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

    // Always validate phone number since it's required
    if (!validatePhoneNumber(formData.phone_number)) {
      setError(
        "Please enter a valid phone number (10-15 digits, may start with +)"
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create a copy of form data (no need to check if empty now since it's required)
      const formDataToSubmit = { ...formData };

      // Send request to appropriate endpoint based on role
      const endpoint =
        selectedRole === "doctor"
          ? "/doctor"
          : selectedRole === "receptionist"
          ? "/employees/receptionist"
          : "/employees/admin";

      await api.post(endpoint, formDataToSubmit);

      setSuccess(
        `${
          selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)
        } created successfully!`
      );

      // Navigate away after a delay
      setTimeout(() => {
        navigate("/admin/employees");
      }, 2000);
    } catch (err: unknown) {
      console.error(`Failed to create ${selectedRole}:`, err);

      // Enhanced error handling
      let errorMessage = `Failed to create ${selectedRole}. Please try again.`;

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

          if (response?.status === 409) {
            if (
              response?.data?.field === "phone_number" ||
              response?.data?.message?.toLowerCase().includes("phone")
            ) {
              errorMessage =
                "This phone number is already registered in the system.";
            } else if (
              response?.data?.field === "email" ||
              response?.data?.message?.toLowerCase().includes("email")
            ) {
              errorMessage = "This email address is already in use.";
            } else {
              errorMessage =
                response?.data?.message ||
                "This record already exists. Please check for duplicates.";
            }
          } else if (response?.status === 400) {
            errorMessage =
              response?.data?.message ||
              "Missing required fields or invalid data.";
          } else {
            errorMessage = response?.data?.message || errorMessage;
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
        <h1 className="text-3xl font-bold">Add New Employee</h1>
        <Button variant="outline" onClick={() => navigate("/admin/employees")}>
          Back to Employees
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline"> {success}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="mb-6">
              <Label htmlFor="role">Employee Role</Label>
              <select
                id="role"
                value={selectedRole}
                onChange={handleRoleChange}
                className="w-full p-2 border rounded-md"
              >
                <option value="admin">Administrator</option>
                <option value="doctor">Doctor</option>
                <option value="receptionist">Receptionist</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Personal Information</h3>

                <div className="grid grid-cols-2 gap-4">
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
                </div>

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
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="unspecified">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contact Information</h3>

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

                <div>
                  <Label htmlFor="address_street">Street Address</Label>
                  <Input
                    id="address_street"
                    name="address_street"
                    value={formData.address_street}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                </div>

                <div className="grid grid-cols-2 gap-4">
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
            </div>

            {/* Employment Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Employment Information</h3>
              <div>
                <Label htmlFor="job_title">Job Title *</Label>
                <Input
                  id="job_title"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Doctor-specific Fields */}
            {selectedRole === "doctor" && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Doctor Information</h3>
                <div>
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="bio">Bio/Professional Background</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/employees")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading
                  ? "Creating..."
                  : `Create ${
                      selectedRole.charAt(0).toUpperCase() +
                      selectedRole.slice(1)
                    }`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <ApiErrorDisplay error={error} statusCode={errorStatusCode} />
    </div>
  );
}
