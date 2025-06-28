import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/services/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";

interface PatientDetails {
  patient_id: number;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    date_of_birth: string;
    gender: string;
    address_street: string;
    address_city: string;
    address_postal_code: string;
    address_country: string;
  };
}

export default function PatientDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true);
        // Change this line - use the correct endpoint that exists
        const response = await api.get(`/patients/${id}`);
        setPatient(response.data);
      } catch (err) {
        setError("Failed to load patient details.");
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchPatient();
    }
  }, [id]);

  if (loading) return <div>Loading patient details...</div>;
  if (error) return <ApiErrorDisplay error={error} />;
  if (!patient) return <div>Patient not found.</div>;

  return (
    <div className="container mx-auto p-4">
      <Button asChild variant="outline" className="mb-4">
        <Link to="/doctor/services">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Services
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <User className="mr-2 h-6 w-6" />
            {patient.user.first_name} {patient.user.last_name}
          </CardTitle>
          <CardDescription>Patient ID: {patient.patient_id}</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Contact Information</h3>
            <p className="flex items-center">
              <Mail className="mr-2 h-4 w-4 text-muted-foreground" />{" "}
              {patient.user.email}
            </p>
            <p className="flex items-center">
              <Phone className="mr-2 h-4 w-4 text-muted-foreground" />{" "}
              {patient.user.phone_number}
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Personal Information</h3>
            <p className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />{" "}
              Born on {format(new Date(patient.user.date_of_birth), "PPP")}
            </p>
            <p className="capitalize flex items-center">
              <User className="mr-2 h-4 w-4 text-muted-foreground" />{" "}
              {patient.user.gender}
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Address</h3>
            <p className="flex items-center">
              <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
              {patient.user.address_street}, {patient.user.address_city},{" "}
              {patient.user.address_postal_code}, {patient.user.address_country}
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Emergency Contact</h3>
            <p>
              <strong>Name:</strong> {patient.emergency_contact_name || "N/A"}
            </p>
            <p>
              <strong>Phone:</strong> {patient.emergency_contact_phone || "N/A"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
