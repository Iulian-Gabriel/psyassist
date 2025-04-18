import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FilePlus } from "lucide-react";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import { Eye, Edit } from "lucide-react";

interface PsychForm {
  form_id: number;
  title: string;
  description: string | null;
  created_at: string;
  user: {
    first_name: string;
    last_name: string;
  };
  responseCount?: number;
}

export default function PsychologicalForms() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState<PsychForm[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchForms = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/forms");
      setForms(response.data);
    } catch (err) {
      console.error("Failed to fetch forms:", err);
      setError("Failed to load psychological assessment forms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Psychological Assessment Forms</h1>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/psychological-forms/create")}>
            <FilePlus className="mr-2 h-4 w-4" />
            Create New Form
          </Button>
        </div>
      </div>

      {error && <ApiErrorDisplay error={error} className="mb-6" />}

      <Card>
        <CardHeader>
          <CardTitle>Available Forms</CardTitle>
          <CardDescription>
            Psychological assessment forms created for patients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-6">
              <p>Loading forms...</p>
            </div>
          ) : forms.length === 0 ? (
            <div className="text-center p-6">
              <p className="text-muted-foreground">
                No psychological assessment forms found
              </p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => navigate("/psychological-forms/create")}
              >
                Create Your First Form
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((form) => (
                  <TableRow key={form.form_id}>
                    <TableCell>{form.form_id}</TableCell>
                    <TableCell>{form.title}</TableCell>
                    <TableCell>
                      {form.description || "No description"}
                    </TableCell>
                    <TableCell>
                      {new Date(form.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(`/psychological-forms/${form.form_id}`)
                          }
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(
                              `/psychological-forms/${form.form_id}/edit`
                            )
                          }
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
