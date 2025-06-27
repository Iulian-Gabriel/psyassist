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
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

// This interface describes the full data we expect for a single test result
interface TestResultData {
  test_instance_id: number;
  testStopDate: string;
  patientResponse: Record<string, any>; // This will hold the answers { question_0: "Answer", ... }
  testTemplateVersion: {
    questionsJson: any[]; // The array of question objects
    testTemplate: {
      name: string;
      description: string;
    };
  };
}

export default function PatientTestResult() {
  const { testInstanceId } = useParams<{ testInstanceId: string }>();
  const [result, setResult] = useState<TestResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTestResult = async () => {
      if (!testInstanceId) return;
      try {
        setLoading(true);
        setError(null);
        // This is the same endpoint the doctor uses, but our backend now allows patients
        const response = await api.get(`/tests/${testInstanceId}`);
        setResult(response.data);
      } catch (err: any) {
        console.error("Error fetching test results:", err);
        setError(err.response?.data?.message || "Failed to load test results.");
      } finally {
        setLoading(false);
      }
    };

    fetchTestResult();
  }, [testInstanceId]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        Loading results...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <ApiErrorDisplay error={error} />
        <Button asChild variant="outline" className="mt-4">
          <Link to="/patient/tests">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Tests
          </Link>
        </Button>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="container mx-auto p-4 text-center">No results found.</div>
    );
  }

  const questions = result.testTemplateVersion.questionsJson || [];
  const answers = result.patientResponse || {};

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Button asChild variant="outline" className="mb-4">
        <Link to="/patient/my-tests">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Tests
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">
            {result.testTemplateVersion.testTemplate.name}
          </CardTitle>
          <CardDescription>
            Results from your test completed on{" "}
            {format(new Date(result.testStopDate), "MMMM d, yyyy 'at' h:mm a")}
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">
            Your Responses
          </h3>
          <div className="space-y-6">
            {questions.map((question, index) => {
              const questionKey = `question_${index}`;
              const answer = answers[questionKey];
              return (
                <div key={index} className="p-4 border rounded-lg bg-slate-50">
                  <p className="font-semibold mb-2">
                    {question.title || "Question"}
                  </p>
                  <p className="text-lg text-slate-800">
                    {answer || (
                      <span className="text-muted-foreground italic">
                        No answer provided
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
            {Object.keys(answers).length === 0 && (
              <p className="text-muted-foreground text-center p-4">
                You did not provide any responses for this test.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
