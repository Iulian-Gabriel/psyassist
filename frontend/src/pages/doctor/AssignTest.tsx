import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "@/services/api";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import { ArrowLeft, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

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

  // State for the combobox
  const [patientPopoverOpen, setPatientPopoverOpen] = useState(false);

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
        const patientsPromise = api.get("doctor/current/patients");

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

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <p>Loading data for test assignment...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Assign a New Test</h1>
        <Button variant="outline" asChild>
          <Link to="/doctor/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {error && <ApiErrorDisplay error={error} className="mb-6" />}

      <Card>
        <CardHeader>
          <CardTitle>Assignment Details</CardTitle>
          <CardDescription>
            Select a patient and the psychological test you want to assign.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Patient Selection Combobox */}
              <div className="space-y-2">
                <Label htmlFor="patient">Select Patient</Label>
                <Popover
                  open={patientPopoverOpen}
                  onOpenChange={setPatientPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={patientPopoverOpen}
                      className="w-full justify-between"
                    >
                      {selectedPatientId
                        ? patients.find(
                            (p) => p.patient_id.toString() === selectedPatientId
                          )?.user.first_name +
                          " " +
                          patients.find(
                            (p) => p.patient_id.toString() === selectedPatientId
                          )?.user.last_name
                        : "Select patient..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Search patient by name or email..." />
                      <CommandList>
                        <CommandEmpty>No patient found.</CommandEmpty>
                        <CommandGroup>
                          {patients.map((patient) => (
                            <CommandItem
                              key={patient.patient_id}
                              value={`${patient.user.first_name} ${patient.user.last_name} ${patient.user.email}`}
                              onSelect={() => {
                                setSelectedPatientId(
                                  patient.patient_id.toString()
                                );
                                setPatientPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedPatientId ===
                                    patient.patient_id.toString()
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <div>
                                <p className="font-medium">
                                  {patient.user.first_name}{" "}
                                  {patient.user.last_name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {patient.user.email}
                                </p>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Test Form Selection */}
              <div className="space-y-2">
                <Label htmlFor="form">Select Test Form</Label>
                <Select
                  value={selectedFormId}
                  onValueChange={setSelectedFormId}
                >
                  <SelectTrigger id="form">
                    <SelectValue placeholder="Choose a test form" />
                  </SelectTrigger>
                  <SelectContent>
                    {testForms.map((form) => (
                      <SelectItem
                        key={form.form_id}
                        value={form.form_id.toString()}
                      >
                        {form.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Assigning..." : "Assign Test"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
