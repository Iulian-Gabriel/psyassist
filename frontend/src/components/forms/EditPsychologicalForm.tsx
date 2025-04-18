import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/services/api";
import { toast } from "sonner";
import { Plus, ArrowDown, ArrowUp, Trash2, ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";

type QuestionType = "TEXT" | "MULTIPLE_CHOICE" | "SCALE";

interface Question {
  title: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
  lowerBound?: number;
  upperBound?: number;
}

interface ApiQuestion {
  question: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
  minValue?: number;
  maxValue?: number;
}

export default function EditPsychologicalForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch the existing form
  useEffect(() => {
    const fetchForm = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/forms/${id}/responses`);
        const { form, questions: formQuestions } = response.data;

        setTitle(form.title || "");
        setDescription(form.description || "");

        // Convert the backend question format to our frontend format
        const formattedQuestions = formQuestions.map((q: ApiQuestion) => ({
          title: q.question,
          type: q.type,
          required: q.required ?? true,
          options: q.options,
          lowerBound: q.minValue,
          upperBound: q.maxValue,
        }));

        setQuestions(formattedQuestions);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch form:", err);
        setError("Failed to load form data");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchForm();
    }
  }, [id]);

  const addQuestion = () => {
    setQuestions([...questions, { title: "", type: "TEXT", required: true }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const moveQuestionUp = (index: number) => {
    if (index === 0) return;
    const newQuestions = [...questions];
    [newQuestions[index - 1], newQuestions[index]] = [
      newQuestions[index],
      newQuestions[index - 1],
    ];
    setQuestions(newQuestions);
  };

  const moveQuestionDown = (index: number) => {
    if (index === questions.length - 1) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[index + 1]] = [
      newQuestions[index + 1],
      newQuestions[index],
    ];
    setQuestions(newQuestions);
  };

  const updateQuestion = (
    index: number,
    field: keyof Question,
    value: string | boolean | string[] | number | undefined
  ) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };

    // Reset options when changing question type
    if (field === "type" && value !== "MULTIPLE_CHOICE") {
      delete updatedQuestions[index].options;
    }

    // Initialize options array for multiple choice
    if (field === "type" && value === "MULTIPLE_CHOICE") {
      updatedQuestions[index].options = [""];
    }

    // Initialize scale bounds
    if (field === "type" && value === "SCALE") {
      updatedQuestions[index].lowerBound = 1;
      updatedQuestions[index].upperBound = 5;
    }

    setQuestions(updatedQuestions);
  };

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    if (!updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options = [];
    }
    updatedQuestions[questionIndex].options!.push("");
    setQuestions(updatedQuestions);
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options![optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options = updatedQuestions[
      questionIndex
    ].options!.filter((_, idx) => idx !== optionIndex);
    setQuestions(updatedQuestions);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!title) {
      toast.error("Form title is required");
      return;
    }

    if (questions.length === 0) {
      toast.error("At least one question is required");
      return;
    }

    for (const question of questions) {
      if (!question.title) {
        toast.error("All questions must have a title");
        return;
      }

      if (
        question.type === "MULTIPLE_CHOICE" &&
        (!question.options || question.options.length < 2)
      ) {
        toast.error("Multiple choice questions must have at least 2 options");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Format questions for backend
      const formattedQuestions = questions.map((question) => ({
        question: question.title,
        type: question.type,
        required: question.required,
        options: question.options,
        minValue: question.lowerBound,
        maxValue: question.upperBound,
      }));

      await api.put(`/forms/${id}`, {
        name: title,
        description,
        questions: formattedQuestions,
        isExternal: false,
      });

      toast.success("Form updated successfully!");
      navigate(`/psychological-forms/${id}`);
    } catch (err) {
      console.error("Error updating form:", err);
      setError("Failed to update form");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p>Loading form data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Edit Psychological Assessment Form
        </h1>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {error && <ApiErrorDisplay error={error} />}

      <Card>
        <CardHeader>
          <CardTitle>Edit Form</CardTitle>
          <CardDescription>
            Modify your psychological assessment form
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Form Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter form title"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter form description"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Questions</h3>
                  <Button
                    type="button"
                    onClick={addQuestion}
                    disabled={isSubmitting}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Question
                  </Button>
                </div>

                {questions.map((question, index) => (
                  <Card key={index} className="p-4 border">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <Label htmlFor={`question-${index}`}>
                          Question {index + 1}
                        </Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => moveQuestionUp(index)}
                            disabled={index === 0 || isSubmitting}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => moveQuestionDown(index)}
                            disabled={
                              index === questions.length - 1 || isSubmitting
                            }
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeQuestion(index)}
                            disabled={isSubmitting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <Input
                        id={`question-${index}`}
                        value={question.title}
                        onChange={(e) =>
                          updateQuestion(index, "title", e.target.value)
                        }
                        placeholder="Enter question"
                        disabled={isSubmitting}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`type-${index}`}>Question Type</Label>
                          <select
                            id={`type-${index}`}
                            value={question.type}
                            onChange={(e) =>
                              updateQuestion(
                                index,
                                "type",
                                e.target.value as QuestionType
                              )
                            }
                            className="w-full p-2 mt-1 border rounded-md"
                            disabled={isSubmitting}
                          >
                            <option value="TEXT">Text</option>
                            <option value="MULTIPLE_CHOICE">
                              Multiple Choice
                            </option>
                            <option value="SCALE">Scale</option>
                          </select>
                        </div>
                        <div className="flex items-center space-x-2 mt-8">
                          <Checkbox
                            id={`required-${index}`}
                            checked={question.required}
                            onCheckedChange={(checked) =>
                              updateQuestion(index, "required", !!checked)
                            }
                            disabled={isSubmitting}
                          />
                          <Label htmlFor={`required-${index}`}>Required</Label>
                        </div>
                      </div>

                      {question.type === "MULTIPLE_CHOICE" && (
                        <div className="space-y-2">
                          <Label>Options</Label>
                          {question.options?.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className="flex items-center gap-2"
                            >
                              <Input
                                value={option}
                                onChange={(e) =>
                                  updateOption(
                                    index,
                                    optionIndex,
                                    e.target.value
                                  )
                                }
                                placeholder={`Option ${optionIndex + 1}`}
                                disabled={isSubmitting}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeOption(index, optionIndex)}
                                disabled={
                                  question.options!.length <= 2 || isSubmitting
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(index)}
                            disabled={isSubmitting}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Option
                          </Button>
                        </div>
                      )}

                      {question.type === "SCALE" && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`min-${index}`}>Min Value</Label>
                            <Input
                              id={`min-${index}`}
                              type="number"
                              value={question.lowerBound || 1}
                              onChange={(e) =>
                                updateQuestion(
                                  index,
                                  "lowerBound",
                                  parseInt(e.target.value)
                                )
                              }
                              min="0"
                              max="10"
                              disabled={isSubmitting}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`max-${index}`}>Max Value</Label>
                            <Input
                              id={`max-${index}`}
                              type="number"
                              value={question.upperBound || 5}
                              onChange={(e) =>
                                updateQuestion(
                                  index,
                                  "upperBound",
                                  parseInt(e.target.value)
                                )
                              }
                              min="1"
                              max="10"
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}

                {questions.length === 0 && (
                  <div className="text-center p-6 border rounded-md">
                    <p className="text-muted-foreground">No questions added</p>
                    <Button
                      type="button"
                      className="mt-2"
                      onClick={addQuestion}
                      disabled={isSubmitting}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Question
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? "Saving..." : "Update Form"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
