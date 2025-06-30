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
import { Badge } from "@/components/ui/badge";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import { ArrowLeft, User, Calendar, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

// This interface now matches the detailed data structure from the API
interface TestResultData {
  test_instance_id: number;
  testStopDate: string;
  patientResponse: Record<string, any>;
  testTemplateVersion: {
    version: number;
    questionsJson: any[];
    testTemplate: {
      name: string;
      description?: string; // It might be in template_questions in some cases
      template_questions?: { description?: string }; // Fallback
    };
  };
  patient: {
    user: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

export default function PatientTestResult() {
  const { testInstanceId } = useParams<{ testInstanceId: string }>();
  const { user } = useAuth(); // Get authenticated user info
  const [result, setResult] = useState<TestResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = user?.roles?.includes("admin");

  // Determine the back URL based on user role
  const backUrl = isAdmin ? "/admin/tests/completed" : "/patient/my-tests";
  const backText = isAdmin ? "Back to All Tests" : "Back to My Tests";

  useEffect(() => {
    const fetchTestResult = async () => {
      if (!testInstanceId) return;
      try {
        setLoading(true);
        setError(null);
        const response = await api.get<TestResultData>(
          `/tests/${testInstanceId}`
        );
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
          <Link to={backUrl}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backText}
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

  const testTitle = result.testTemplateVersion.testTemplate.name;
  const testDescription =
    result.testTemplateVersion.testTemplate.description ||
    result.testTemplateVersion.testTemplate.template_questions?.description ||
    "No description available.";
  const questions = result.testTemplateVersion.questionsJson || [];
  const answers = result.patientResponse || {};

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Test Result</h1>
        <Button asChild variant="outline">
          <Link to={backUrl}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backText}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Patient</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user?.firstName} {user?.lastName}
            </div>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Test Form</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testTitle}</div>
            <p className="text-xs text-muted-foreground">
              Version {result.testTemplateVersion.version}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <Badge>Completed</Badge>
            <p className="text-xs text-muted-foreground mt-1">
              Completed on{" "}
              {format(new Date(result.testStopDate), "MMM d, yyyy")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{testTitle}</CardTitle>
          <CardDescription>{testDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {questions.map((question, index) => {
              const questionKey = `question_${index}`;
              const answer = answers[questionKey];

              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="font-medium mb-2">
                      {question.question || question.title}
                      {question.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </div>
                    <Badge variant="outline">
                      {question.type === "TEXT" && "Text"}
                      {question.type === "MULTIPLE_CHOICE" && "Multiple Choice"}
                      {question.type === "SCALE" && "Scale"}
                    </Badge>
                  </div>

                  <div className="mt-2 bg-slate-50 dark:bg-slate-800 p-3 rounded">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Your Answer:
                    </p>
                    <div className="text-slate-900 dark:text-slate-100">
                      {answer || (
                        <span className="italic">No answer provided</span>
                      )}
                      {question.type === "SCALE" && (
                        <span className="text-sm text-muted-foreground ml-2">
                          (Scale: {question.minValue || 1}-
                          {question.maxValue || 5})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
