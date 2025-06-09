import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/services/api";
import { format } from "date-fns";
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
import {
  ArrowLeft,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface TestInstance {
  test_instance_id: number;
  patient_id: number;
  test_template_version_ID: number;
  testStartDate: string | null;
  testStopDate: string | null;
  patientResponse: any | null;
  patient: {
    user: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
  testTemplateVersion: {
    version: number;
    questionsJson: any[];
    testTemplate: {
      test_template_id: number;
      name: string;
      template_questions: any;
    };
  };
}

export default function TestResult() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState<TestInstance | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTestData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const response = await api.get(`/tests/${id}`);
        setTestData(response.data);
      } catch (err: any) {
        console.error("Error fetching test data:", err);
        setError(err.response?.data?.message || "Failed to load test data");
      } finally {
        setLoading(false);
      }
    };

    fetchTestData();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <p>Loading test data...</p>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="container mx-auto p-4">
        <ApiErrorDisplay error={error || "Test not found"} />
        <Button
          variant="outline"
          onClick={() => navigate("/patient-tests")}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tests
        </Button>
      </div>
    );
  }

  const isCompleted = !!testData.testStopDate;
  const testTitle = testData.testTemplateVersion.testTemplate.name;
  const testDescription =
    testData.testTemplateVersion.testTemplate.template_questions?.description ||
    "No description";
  const questions = testData.testTemplateVersion.questionsJson || [];
  const answers = testData.patientResponse || {};

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Test Result</h1>
        <Button variant="outline" onClick={() => navigate("/patient-tests")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tests
        </Button>
      </div>

      {error && <ApiErrorDisplay error={error} className="mb-6" />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Patient</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {testData.patient.user.first_name}{" "}
              {testData.patient.user.last_name}
            </div>
            <p className="text-xs text-muted-foreground">
              {testData.patient.user.email}
            </p>
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
              Version {testData.testTemplateVersion.version}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            {isCompleted ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={isCompleted ? "default" : "secondary"}>
                {isCompleted ? "Completed" : "Pending"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isCompleted
                ? `Completed on ${format(
                    new Date(testData.testStopDate!),
                    "MMM d, yyyy"
                  )}`
                : testData.testStartDate
                ? `Started on ${format(
                    new Date(testData.testStartDate),
                    "MMM d, yyyy"
                  )}`
                : "Not started yet"}
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
          {!isCompleted ? (
            <div className="text-center p-6">
              <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
              <p className="mt-2 font-medium">Test not completed yet</p>
              <p className="text-muted-foreground">
                The patient has not completed this test. Results will appear
                here once completed.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question, index) => {
                // Handle different question types
                const questionKey = `question_${index}`;
                const answer = answers[questionKey] || "No answer";

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
                        {question.type === "MULTIPLE_CHOICE" &&
                          "Multiple Choice"}
                        {question.type === "SCALE" && "Scale"}
                      </Badge>
                    </div>

                    <div className="mt-2 bg-slate-50 p-3 rounded">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Patient's Answer:
                      </p>

                      {question.type === "TEXT" && (
                        <p className="text-slate-900">
                          {answer || "No response"}
                        </p>
                      )}

                      {question.type === "MULTIPLE_CHOICE" && (
                        <p className="text-slate-900">
                          {answer || "No option selected"}
                        </p>
                      )}

                      {question.type === "SCALE" && (
                        <div className="flex items-center">
                          <span className="font-bold text-xl">
                            {answer || "N/A"}
                          </span>
                          <span className="text-sm text-muted-foreground ml-2">
                            (Scale:{" "}
                            {question.lowerBound || question.minValue || 1}-
                            {question.upperBound || question.maxValue || 5})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
