import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";

interface FormQuestion {
  id: string;
  text: string;
  type: string;
  required: boolean;
  options: Array<{
    value: string;
    label: string;
  }>;
}

interface FormSection {
  id: string;
  title: string;
  description: string;
  questions: FormQuestion[];
}

interface FormStructure {
  title: string;
  description: string;
  sections: FormSection[];
}

export default function InitialAssessmentForm() {
  const navigate = useNavigate();
  const [formStructure, setFormStructure] = useState<FormStructure | null>(
    null
  );
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [currentSection, setCurrentSection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFormStructure = async () => {
      try {
        setLoading(true);
        const response = await api.get("/initial-form/form"); // Updated endpoint
        setFormStructure(response.data);
      } catch (err: any) {
        console.error("Error fetching form structure:", err);
        setError("Failed to load assessment form");
      } finally {
        setLoading(false);
      }
    };

    fetchFormStructure();
  }, []);

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const isCurrentSectionComplete = () => {
    if (!formStructure) return false;
    const currentSectionQuestions =
      formStructure.sections[currentSection]?.questions || [];
    return currentSectionQuestions.every((q) => responses[q.id]);
  };

  const calculateProgress = () => {
    if (!formStructure) return 0;
    const totalQuestions = formStructure.sections.reduce(
      (total, section) => total + section.questions.length,
      0
    );
    const answeredQuestions = Object.keys(responses).length;
    return (answeredQuestions / totalQuestions) * 100;
  };

  const handleNextSection = () => {
    if (formStructure && currentSection < formStructure.sections.length - 1) {
      setCurrentSection((prev) => prev + 1);
    }
  };

  const handlePreviousSection = () => {
    if (currentSection > 0) {
      setCurrentSection((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formStructure) return;

    // Validate all questions are answered
    const allQuestions = formStructure.sections.flatMap(
      (section) => section.questions
    );
    const unansweredQuestions = allQuestions.filter((q) => !responses[q.id]);

    if (unansweredQuestions.length > 0) {
      setError(
        `Please answer all questions. ${unansweredQuestions.length} questions remain unanswered.`
      );
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await api.post("/initial-form/submit", {
        // Updated endpoint
        responses,
      });

      navigate("/patient/initial-form/view", {
        state: {
          message: "Initial assessment has been submitted successfully!",
        },
      });
    } catch (err: any) {
      console.error("Error submitting assessment:", err);
      setError(
        "An error occurred while submitting the assessment. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <p>Loading assessment form...</p>
      </div>
    );
  }

  if (!formStructure) {
    return (
      <div className="container mx-auto p-4">
        <ApiErrorDisplay error={error || "Form could not be loaded"} />
      </div>
    );
  }

  const currentSectionData = formStructure.sections[currentSection];
  const progress = calculateProgress();

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{formStructure.title}</h1>
        <p className="text-muted-foreground mb-4">
          {formStructure.description}
        </p>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Completion Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {error && <ApiErrorDisplay error={error} className="mb-6" />}

      <Card>
        <CardHeader>
          <CardTitle>{currentSectionData.title}</CardTitle>
          <CardDescription>{currentSectionData.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentSectionData.questions.map((question) => (
            <div key={question.id} className="space-y-3">
              <div className="font-medium text-sm leading-relaxed">
                {question.text}
                {question.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </div>

              <RadioGroup
                value={responses[question.id] || ""}
                onValueChange={(value) =>
                  handleResponseChange(question.id, value)
                }
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                {question.options.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-2"
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={`${question.id}_${option.value}`}
                    />
                    <Label
                      htmlFor={`${question.id}_${option.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mt-6">
        <Button
          variant="outline"
          onClick={handlePreviousSection}
          disabled={currentSection === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <div className="text-sm text-muted-foreground">
          Section {currentSection + 1} of {formStructure.sections.length}
        </div>

        {currentSection < formStructure.sections.length - 1 ? (
          <Button
            onClick={handleNextSection}
            disabled={!isCurrentSectionComplete()}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!isCurrentSectionComplete() || submitting}
          >
            {submitting ? (
              "Submitting..."
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Submit Assessment
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
