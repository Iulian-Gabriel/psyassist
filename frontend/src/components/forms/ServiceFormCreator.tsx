import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// If shadcn/ui is installed but the component is missing, add it with:
// npx shadcn-ui@latest add select
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Trash2, MoveDown, MoveUp } from "lucide-react";
import { toast } from "sonner";

type QuestionType = "TEXT" | "MULTIPLE_CHOICE" | "SCALE";

interface Question {
  title: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
  lowerBound?: number;
  upperBound?: number;
}

export default function ServiceFormCreator() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { title: "", type: "TEXT", required: true },
  ]);

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

    // Special handling for scale bounds
    if (field === "lowerBound" || field === "upperBound") {
      // If value is empty, undefined, or not a valid number, use default values
      let numericValue =
        typeof value === "number" ? value : parseInt(String(value));

      if (isNaN(numericValue)) {
        numericValue = field === "lowerBound" ? 1 : 5; // Default values
      }

      // Ensure bounds are within reasonable limits
      if (field === "lowerBound") {
        numericValue = Math.max(0, Math.min(numericValue, 10)); // Minimum between 0-10
      } else {
        numericValue = Math.max(1, Math.min(numericValue, 10)); // Maximum between 1-10
      }

      updatedQuestions[index] = {
        ...updatedQuestions[index],
        [field]: numericValue,
      };
    } else {
      // Original logic for other fields
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
        toast.error("Multiple choice questions must have at least two options");
        return;
      }

      // Ensure scale questions have proper min/max values
      if (question.type === "SCALE") {
        if (question.lowerBound === undefined || question.lowerBound === null) {
          question.lowerBound = 1; // Default minimum
        }
        if (question.upperBound === undefined || question.upperBound === null) {
          question.upperBound = 5; // Default maximum
        }
      }
    }

    try {
      setIsSubmitting(true);

      // Map our frontend question format to the backend format
      const formattedQuestions = questions.map((question) => ({
        question: question.title,
        type: question.type,
        required: question.required,
        options: question.options,
        minValue: question.type === "SCALE" ? question.lowerBound : undefined,
        maxValue: question.type === "SCALE" ? question.upperBound : undefined,
      }));

      const response = await api.post("/forms", {
        name: title,
        description,
        questions: formattedQuestions,
        isExternal: false,
      });

      toast.success("Psychological assessment form created successfully!");

      // Navigate to the form details page
      navigate(`/psychological-forms/${response.data.form.form_id}`);
    } catch (error) {
      console.error("Error creating form:", error);
      toast.error("Failed to create psychological assessment form");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Create Psychological Assessment</h1>
        <Button
          variant="outline"
          onClick={() => navigate("/psychological-forms")}
        >
          Back to Forms
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Details</CardTitle>
          <CardDescription>
            Create a new psychological assessment form using Google Forms API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Form Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Depression Assessment Questionnaire"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide instructions or context for this assessment"
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Questions</h2>
                <Button
                  type="button"
                  onClick={addQuestion}
                  variant="outline"
                  size="sm"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
              </div>

              {questions.map((question, index) => (
                <Card
                  key={index}
                  className="relative border-l-4 border-l-blue-500"
                >
                  <CardContent className="pt-6 pb-4">
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => moveQuestionUp(index)}
                        disabled={index === 0}
                      >
                        <MoveUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => moveQuestionDown(index)}
                        disabled={index === questions.length - 1}
                      >
                        <MoveDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeQuestion(index)}
                        disabled={questions.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>

                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="col-span-8">
                          <Label htmlFor={`question_${index}`}>Question</Label>
                          <Input
                            id={`question_${index}`}
                            value={question.title}
                            onChange={(e) =>
                              updateQuestion(index, "title", e.target.value)
                            }
                            placeholder="Enter your question"
                            required
                          />
                        </div>

                        <div className="col-span-4">
                          <Label htmlFor={`question_type_${index}`}>
                            Question Type
                          </Label>
                          <Select
                            value={question.type}
                            onValueChange={(value) =>
                              updateQuestion(index, "type", value)
                            }
                          >
                            <SelectTrigger id={`question_type_${index}`}>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="TEXT">
                                Text Response
                              </SelectItem>
                              <SelectItem value="MULTIPLE_CHOICE">
                                Multiple Choice
                              </SelectItem>
                              <SelectItem value="SCALE">
                                Scale Rating
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {question.type === "MULTIPLE_CHOICE" && (
                        <div className="space-y-2">
                          <Label>Options</Label>
                          {question.options?.map((option, optIdx) => (
                            <div key={optIdx} className="flex gap-2">
                              <Input
                                value={option}
                                onChange={(e) =>
                                  updateOption(index, optIdx, e.target.value)
                                }
                                placeholder={`Option ${optIdx + 1}`}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeOption(index, optIdx)}
                                disabled={question.options!.length <= 2}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(index)}
                            className="mt-1"
                          >
                            <PlusCircle className="mr-2 h-3 w-3" />
                            Add Option
                          </Button>
                        </div>
                      )}

                      {question.type === "SCALE" && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`lower_bound_${index}`}>
                              Minimum Value
                            </Label>
                            <Input
                              id={`lower_bound_${index}`}
                              type="number"
                              min="0"
                              max="10"
                              value={question.lowerBound || 1}
                              onChange={(e) => {
                                const val =
                                  e.target.value === ""
                                    ? 1
                                    : parseInt(e.target.value);
                                updateQuestion(index, "lowerBound", val);
                              }}
                              onBlur={(e) => {
                                // On blur, ensure we have a valid number
                                if (
                                  e.target.value === "" ||
                                  isNaN(parseInt(e.target.value))
                                ) {
                                  updateQuestion(index, "lowerBound", 1);
                                }
                              }}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`upper_bound_${index}`}>
                              Maximum Value
                            </Label>
                            <Input
                              id={`upper_bound_${index}`}
                              type="number"
                              min="1"
                              max="10"
                              value={question.upperBound || 5}
                              onChange={(e) => {
                                const val =
                                  e.target.value === ""
                                    ? 5
                                    : parseInt(e.target.value);
                                updateQuestion(index, "upperBound", val);
                              }}
                              onBlur={(e) => {
                                // On blur, ensure we have a valid number
                                if (
                                  e.target.value === "" ||
                                  isNaN(parseInt(e.target.value))
                                ) {
                                  updateQuestion(index, "upperBound", 5);
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`required_${index}`}
                          checked={question.required}
                          onChange={(e) =>
                            updateQuestion(index, "required", e.target.checked)
                          }
                          className="h-4 w-4"
                        />
                        <Label
                          htmlFor={`required_${index}`}
                          className="text-sm"
                        >
                          Required question
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => navigate("/psychological-forms")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating Form..." : "Create Form"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
