import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import { ArrowLeft, FileText, Calendar, Search } from "lucide-react";

// Interfaces based on your Prisma schema
interface Patient {
  patient_id: number;
  user: {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

// Update the TestTemplate interface to match the actual data structure
interface TestTemplate {
  form_id: number; // Changed from test_template_id
  title: string; // Changed from name
  description: string; // Added this field
  created_at: string; // Added this field
  // Other properties that might be in your actual form data
}

export default function AssignTest() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [testForms, setTestForms] = useState<TestTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedFormId, setSelectedFormId] = useState<string>("");

  // Update the fetchData function to properly filter forms
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simply get all patients without role restrictions
        const patientsPromise = api.get("/patients");

        // Fetch forms and patients concurrently
        const [patientsResponse, formsResponse] = await Promise.all([
          patientsPromise,
          api.get("/forms"),
        ]);

        console.log("Patients data:", patientsResponse.data);
        console.log("Forms data:", formsResponse.data);

        // Filter out any null or invalid patient records
        const validPatients = patientsResponse.data.filter(
          (patient: any) => patient && patient.patient_id && patient.user
        );

        // Filter out any null or invalid form records
        // Updated to match the actual properties in your API response
        const validForms = formsResponse.data.filter(
          (form: any) => form && form.form_id
        );

        setPatients(validPatients);
        setTestForms(validForms);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(
          err.message ||
            err.response?.data?.message ||
            "Failed to load required data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update the handleSubmit function to properly call the API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatientId || !selectedFormId) {
      toast.error("Please select both a patient and a form");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Find the selected form
      const selectedForm = testForms.find(
        (form) => form.form_id === parseInt(selectedFormId)
      );

      if (!selectedForm) {
        throw new Error("Invalid form selected");
      }

      console.log("Creating test instance with:", {
        patient_id: parseInt(selectedPatientId),
        form_id: selectedForm.form_id,
      });

      // Create the test instance
      const response = await api.post("/tests/assign", {
        patient_id: parseInt(selectedPatientId),
        form_id: selectedForm.form_id,
      });

      console.log("Test instance created:", response.data);
      toast.success("Test assigned to patient successfully");
      navigate("/patient-tests");
    } catch (err: any) {
      console.error("Error assigning test:", err);
      setError(err.response?.data?.message || "Failed to assign test");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const fullName =
      `${patient.user.first_name} ${patient.user.last_name}`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      patient.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Assign Test to Patient</h1>
        <Button variant="outline" onClick={() => navigate("/patient-tests")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tests
        </Button>
      </div>

      {error && <ApiErrorDisplay error={error} className="mb-6" />}

      <Card>
        <CardHeader>
          <CardTitle>Assign Test</CardTitle>
          <CardDescription>
            Select a patient and a test form to assign
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="search">Search Patient</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name or email"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="patient">Select Patient</Label>
                <Select
                  value={selectedPatientId}
                  onValueChange={setSelectedPatientId}
                  disabled={submitting}
                >
                  <SelectTrigger id="patient" className="w-full">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPatients.length === 0 ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        No patients found
                      </div>
                    ) : (
                      filteredPatients.map((patient) =>
                        patient && patient.patient_id ? (
                          <SelectItem
                            key={patient.patient_id}
                            value={patient.patient_id.toString()}
                          >
                            {patient.user?.first_name || ""}{" "}
                            {patient.user?.last_name || ""} (
                            {patient.user?.email || "No email"})
                          </SelectItem>
                        ) : null
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="form">Select Test Form</Label>
                <Select
                  value={selectedFormId}
                  onValueChange={setSelectedFormId}
                  disabled={submitting}
                >
                  <SelectTrigger id="form" className="w-full">
                    <SelectValue placeholder="Select test form" />
                  </SelectTrigger>
                  <SelectContent>
                    {testForms.length === 0 ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        No test forms available
                      </div>
                    ) : (
                      testForms.map((form) =>
                        form && form.form_id ? (
                          <SelectItem
                            key={form.form_id}
                            value={form.form_id.toString()}
                          >
                            {form.title || "Unnamed form"}
                          </SelectItem>
                        ) : null
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={submitting || !selectedPatientId || !selectedFormId}
              >
                {submitting ? "Assigning..." : "Assign Test"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
