import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Phone, Mail, User } from "lucide-react";
import api from "@/services/api";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";

interface PatientDetails {
  patient_id: number;
  user: {
    user_id: number;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    phone_number?: string;
    date_of_birth?: string;
    gender?: string;
    address_street?: string;
    address_city?: string;
    address_postal_code?: string;
    address_country?: string;
  };
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_conditions?: string;
  allergies?: string;
}

export default function PatientDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatient = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await api.get(`/patients/${id}`);
        setPatient(response.data);
      } catch (err) {
        console.error("Failed to fetch patient details:", err);
        setError("Failed to load patient details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <p>Loading patient details...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Patient Not Found</h1>
          <Link to="/receptionist/patients">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Patients
            </Button>
          </Link>
        </div>
        <p>The requested patient could not be found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Patient Details</h1>
        <div className="flex gap-2">
          <Link to={`/receptionist/patients/${patient.patient_id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Patient
            </Button>
          </Link>
          <Link to="/receptionist/patients">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Patients
            </Button>
          </Link>
        </div>
      </div>

      {error && <ApiErrorDisplay error={error} className="mb-4" />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Full Name
              </label>
              <p className="text-lg">
                {patient.user.first_name} {patient.user.last_name}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Patient ID
              </label>
              <p>{patient.patient_id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Status
              </label>
              <div>
                <Badge
                  variant={patient.user.is_active ? "default" : "destructive"}
                >
                  {patient.user.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
            {patient.user.date_of_birth && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Date of Birth
                </label>
                <p>
                  {new Date(patient.user.date_of_birth).toLocaleDateString()}
                </p>
              </div>
            )}
            {patient.user.gender && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Gender
                </label>
                <p className="capitalize">{patient.user.gender}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="mr-2 h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                {patient.user.email}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Phone Number
              </label>
              <p className="flex items-center">
                <Phone className="mr-2 h-4 w-4" />
                {patient.user.phone_number || "Not provided"}
              </p>
            </div>
            {patient.user.address_street && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Address
                </label>
                <p>
                  {patient.user.address_street}
                  {patient.user.address_city && <br />}
                  {patient.user.address_city} {patient.user.address_postal_code}
                  {patient.user.address_country && <br />}
                  {patient.user.address_country}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        {(patient.emergency_contact_name ||
          patient.emergency_contact_phone) && (
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {patient.emergency_contact_name && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Name
                  </label>
                  <p>{patient.emergency_contact_name}</p>
                </div>
              )}
              {patient.emergency_contact_phone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Phone
                  </label>
                  <p className="flex items-center">
                    <Phone className="mr-2 h-4 w-4" />
                    {patient.emergency_contact_phone}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Medical Information */}
        {(patient.medical_conditions || patient.allergies) && (
          <Card>
            <CardHeader>
              <CardTitle>Medical Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {patient.medical_conditions && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Medical Conditions
                  </label>
                  <p>{patient.medical_conditions}</p>
                </div>
              )}
              {patient.allergies && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Allergies
                  </label>
                  <p>{patient.allergies}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
