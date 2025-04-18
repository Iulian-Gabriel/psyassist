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
import { ArrowLeft } from "lucide-react";
import { formatDate } from "@/lib/utils";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";

interface FormResponse {
  responseId: string;
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

export default function ServiceFormView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormDetails | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFormDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get(`/forms/${id}/responses`);
        setForm(response.data.form);
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
        <p className="text-red-500">Form not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/psychological-forms")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Forms
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
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
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Responses ({responses.length})</CardTitle>
          <CardDescription>
            Patient responses to this assessment form
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {responses.map((response) => (
              <div key={response.responseId} className="border p-4 rounded-md">
                <div className="mb-2 text-sm text-muted-foreground">
                  Submitted on {formatDate(response.timestamp)}
                </div>
                <div className="space-y-2">
                  {Object.entries(response.answers).map(
                    ([question, answer], idx) => (
                      <div key={idx} className="mb-2">
                        <div className="font-medium">{question}</div>
                        <div>
                          {Array.isArray(answer) ? answer.join(", ") : answer}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
