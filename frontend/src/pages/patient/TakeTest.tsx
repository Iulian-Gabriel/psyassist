import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "@/services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";

// Interfaces to match the data structure from the backend
interface Question {
  question: string; // Changed from 'title' to 'question' for consistency
  type: "TEXT" | "MULTIPLE_CHOICE" | "SCALE";
  required: boolean;
  options?: string[];
  minValue?: number;
  maxValue?: number;
}

interface TestData {
  test_instance_id: number;
  testTemplateVersion: {
    questionsJson: Question[];
    testTemplate: {
      name: string;
      description: string;
    };
  };
}

export default function TakeTest() {
  const { testInstanceId } = useParams<{ testInstanceId: string }>();
  const navigate = useNavigate();
  const [testData, setTestData] = useState<TestData | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTest = async () => {
      if (!testInstanceId) return;
      try {
        setLoading(true);
        const response = await api.get(`/tests/${testInstanceId}`);
        setTestData(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load the test.");
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [testInstanceId]);

  const handleAnswerChange = (questionKey: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionKey]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.put(`/tests/${testInstanceId}/submit`, {
        patientResponse: answers,
      });
      toast.success("Test submitted successfully!");
      navigate("/patient/my-tests");
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to submit your answers."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return <div className="container p-4 text-center">Loading test...</div>;
  if (error) return <ApiErrorDisplay error={error} />;
  if (!testData)
    return <div className="container p-4 text-center">Test not found.</div>;

  const { questionsJson, testTemplate } = testData.testTemplateVersion;

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
          <CardTitle className="text-3xl">{testTemplate.name}</CardTitle>
          <CardDescription>{testTemplate.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 mt-4">
          {questionsJson.map((question, index) => {
            const questionKey = `question_${index}`;
            const min = question.minValue || 1;
            const max = question.maxValue || 5;

            return (
              <div key={questionKey} className="p-4 border rounded-lg">
                <Label className="font-semibold text-base mb-3 block">
                  {index + 1}. {question.question}{" "}
                  {question.required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
                {question.type === "TEXT" && (
                  <Textarea
                    value={answers[questionKey] || ""}
                    onChange={(e) =>
                      handleAnswerChange(questionKey, e.target.value)
                    }
                    placeholder="Type your answer here..."
                  />
                )}
                {question.type === "MULTIPLE_CHOICE" && (
                  <RadioGroup
                    onValueChange={(value) =>
                      handleAnswerChange(questionKey, value)
                    }
                    value={answers[questionKey]}
                    className="space-y-2"
                  >
                    {question.options?.map((option, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={option}
                          id={`${questionKey}-${i}`}
                        />
                        <Label htmlFor={`${questionKey}-${i}`}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
                {question.type === "SCALE" && (
                  <div className="mt-4">
                    <div className="flex justify-between space-x-2">
                      {Array.from(
                        { length: max - min + 1 },
                        (_, i) => min + i
                      ).map((val) => (
                        <Button
                          key={val}
                          type="button"
                          variant={
                            answers[questionKey] === String(val)
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          className="min-w-10 flex-1"
                          onClick={() =>
                            handleAnswerChange(questionKey, String(val))
                          }
                        >
                          {val}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full"
          >
            {submitting ? "Submitting..." : "Submit Test"}
            <CheckCircle className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
