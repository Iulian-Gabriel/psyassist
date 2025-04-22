import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, MessageSquare } from "lucide-react";
import { formatDate } from "@/lib/utils";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FormResponse {
  responseId: string;
  patientId?: string;
  patientName?: string;
  timestamp: string;
  answers: Record<string, string | string[]>;
}

interface FormDetails {
  form_id: number;
  title: string;
  description: string | null;
  created_at: string;
  user: {
    first_name: string;
    last_name: string;
  };
}

interface FormQuestion {
  question: string;
  type: "TEXT" | "MULTIPLE_CHOICE" | "SCALE";
  required: boolean;
  options?: string[];
  minValue?: number;
  maxValue?: number;
}

export default function ServiceFormView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormDetails | null>(null);
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("preview");

  useEffect(() => {
    const fetchFormDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get(`/forms/${id}/responses`);
        setForm(response.data.form);
        setQuestions(response.data.questions || []);
        setResponses(response.data.responses || []);
      } catch (err) {
        console.error("Failed to fetch form details:", err);
        setError("Failed to load form details and responses");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchFormDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p>Loading form details...</p>
      </div>
    );
  }

  if (error) {
    return <ApiErrorDisplay error={error} className="mt-4" />;
  }

  if (!form) {
    return (
      <div className="text-center p-6">
        <p className="text-muted-foreground">Form not found</p>
        <Button
          className="mt-4"
          onClick={() => navigate("/psychological-forms")}
        >
          Back to Forms
        </Button>
      </div>
    );
  }

  // Render a visual representation of the question based on its type
  const renderQuestion = (question: FormQuestion, index: number) => {
    return (
      <div key={index} className="mb-6 p-4 border rounded-md">
        <div className="flex items-start gap-2 mb-2">
          <Label className="font-medium text-base">
            {index + 1}. {question.question}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        </div>

        {question.type === "TEXT" && (
          <Textarea
            disabled
            placeholder="Text answer would go here..."
            className="w-full mt-2"
          />
        )}

        {question.type === "MULTIPLE_CHOICE" && question.options && (
          <div className="space-y-2 mt-2">
            {question.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center space-x-2">
                <Checkbox id={`option-${index}-${optionIndex}`} disabled />
                <Label
                  htmlFor={`option-${index}-${optionIndex}`}
                  className="text-sm"
                >
                  {option}
                </Label>
              </div>
            ))}
          </div>
        )}

        {question.type === "SCALE" && (
          <div className="mt-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm">{question.minValue || 1}</span>
              <span className="text-sm">{question.maxValue || 5}</span>
            </div>
            <div className="flex justify-between space-x-2">
              {Array.from(
                {
                  length:
                    (question.maxValue || 5) - (question.minValue || 1) + 1,
                },
                (_, i) => (question.minValue || 1) + i
              ).map((val) => (
                <Button
                  key={val}
                  variant="outline"
                  size="sm"
                  className="min-w-10"
                  disabled
                >
                  {val}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Form Details</h1>
        <Button
          variant="outline"
          onClick={() => navigate("/psychological-forms")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Forms
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{form.title}</CardTitle>
          <CardDescription>
            Created on {formatDate(form.created_at)} by {form.user.first_name}{" "}
            {form.user.last_name}
          </CardDescription>
        </CardHeader>
        {form.description && (
          <CardContent>
            <p className="text-muted-foreground">{form.description}</p>
          </CardContent>
        )}
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="preview">
            <Eye className="h-4 w-4 mr-2" />
            Form Preview
          </TabsTrigger>
          <TabsTrigger value="responses">
            <MessageSquare className="h-4 w-4 mr-2" />
            Responses ({responses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Form Preview</CardTitle>
              <CardDescription>
                Visual representation of how the form appears to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {questions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    This form has no questions
                  </p>
                ) : (
                  questions.map((question, index) =>
                    renderQuestion(question, index)
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responses">
          <Card>
            <CardHeader>
              <CardTitle>Responses</CardTitle>
              <CardDescription>
                Patient responses to this assessment form
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {responses.length === 0 ? (
                  <div className="text-center p-6">
                    <p className="text-muted-foreground">
                      No responses have been collected for this form yet
                    </p>
                  </div>
                ) : (
                  responses.map((response) => (
                    <div
                      key={response.responseId}
                      className="border p-4 rounded-md"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          {response.patientName && (
                            <span className="font-medium">
                              {response.patientName}
                            </span>
                          )}
                          <span className="text-sm text-muted-foreground ml-2">
                            Submitted on {formatDate(response.timestamp)}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        {Object.entries(response.answers).map(
                          ([question, answer], idx) => (
                            <div key={idx} className="mb-2">
                              <div className="font-medium">{question}</div>
                              <div className="text-gray-700 dark:text-gray-300">
                                {Array.isArray(answer)
                                  ? answer.join(", ")
                                  : answer}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
