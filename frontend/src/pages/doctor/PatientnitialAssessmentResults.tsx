import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import { ArrowLeft, FileText } from "lucide-react";
import { format } from "date-fns";

// Interface for the form data returned by the new endpoint
interface InitialAssessmentResult {
  form_id: number;
  submission_date: string;
  form_data: { [key: string]: string | string[] | number }; // Flexible form data
  patient: {
    user: {
      first_name: string;
      last_name: string;
    };
  };
}

export default function PatientInitialAssessmentResults() {
  const { patientId } = useParams<{ patientId: string }>();
  const [result, setResult] = useState<InitialAssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!patientId) return;
      try {
        setLoading(true);
        // Call the new backend endpoint to get results by patient ID
        const response = await api.get(`/initial-form/results/${patientId}`);
        setResult(response.data);
      } catch (err: any) {
        console.error("Error fetching initial assessment results:", err);
        setError(
          err.response?.data?.message ||
            "Failed to load initial assessment results."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [patientId]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        Loading initial assessment results...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Button asChild variant="outline" className="mb-4">
        {/* This link should navigate back to the list the user came from */}
        <Link to="/admin/services">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Services
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <FileText className="mr-3 h-6 w-6" />
            Initial Assessment Results
          </CardTitle>
          {result && (
            <CardDescription>
              Displaying the latest submission for patient:{" "}
              <strong>
                {result.patient.user.first_name} {result.patient.user.last_name}
              </strong>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {error ? (
            <ApiErrorDisplay error={error} />
          ) : !result ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No initial assessment found for this patient.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <p>
                  <strong>Patient:</strong> {result.patient.user.first_name}{" "}
                  {result.patient.user.last_name}
                </p>
                <p>
                  <strong>Submitted On:</strong>{" "}
                  {format(new Date(result.submission_date), "PP p")}
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">Patient Responses</h3>
                {Object.entries(result.form_data).map(([key, value]) => (
                  <div
                    key={key}
                    className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800"
                  >
                    <p className="font-semibold capitalize mb-2 text-sm text-muted-foreground">
                      {key.replace(/_/g, " ")}
                    </p>
                    <p className="text-lg text-slate-800 dark:text-slate-200">
                      {Array.isArray(value) ? value.join(", ") : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
