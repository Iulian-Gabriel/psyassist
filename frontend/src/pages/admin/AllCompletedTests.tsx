import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { ColumnHeader } from "@/components/ui/data-table/ColumnHeader";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import { Badge } from "@/components/ui/badge";
import { Eye, ArrowLeft } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

interface CompletedTest {
  test_instance_id: number;
  testStartDate: string;
  testStopDate: string;
  patient: {
    patient_id: number;
    user: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
  testTemplateVersion: {
    testTemplate: {
      test_template_id: number;
      name: string;
    };
  };
}

export default function AllCompletedTests() {
  const [tests, setTests] = useState<CompletedTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompletedTests = async () => {
      try {
        setLoading(true);
        const response = await api.get("/tests/admin/completed"); // This should work with your controller
        setTests(response.data);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch completed tests:", err);
        setError(
          err.response?.data?.message || "Failed to load completed tests"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedTests();
  }, []);

  const formatDateTime = (dateString: string) => {
    return (
      new Date(dateString).toLocaleDateString() +
      " " +
      new Date(dateString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const columns: ColumnDef<CompletedTest>[] = [
    {
      accessorKey: "test_instance_id",
      header: ({ column }) => <ColumnHeader column={column} title="Test ID" />,
    },
    {
      id: "patient_name",
      accessorFn: (row) =>
        `${row.patient.user.first_name} ${row.patient.user.last_name}`,
      header: ({ column }) => <ColumnHeader column={column} title="Patient" />,
    },
    {
      accessorKey: "patient.user.email",
      header: ({ column }) => <ColumnHeader column={column} title="Email" />,
    },
    {
      accessorKey: "testTemplateVersion.testTemplate.name",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Test Name" />
      ),
    },
    {
      accessorKey: "testStartDate",
      header: ({ column }) => <ColumnHeader column={column} title="Started" />,
      cell: ({ row }) => formatDateTime(row.original.testStartDate),
    },
    {
      accessorKey: "testStopDate",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Completed" />
      ),
      cell: ({ row }) => formatDateTime(row.original.testStopDate),
    },
    {
      id: "status",
      header: "Status",
      cell: () => (
        <Badge className="bg-green-100 text-green-800">Completed</Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button variant="outline" size="sm" asChild>
          <Link to={`/patient-tests/${row.original.test_instance_id}`}>
            <Eye className="h-4 w-4 mr-1" />
            View Results
          </Link>
        </Button>
      ),
    },
  ];

  const searchableColumns = [
    { id: "patient_name", title: "Patient Name" },
    { id: "patient.user.email", title: "Email" },
    { id: "testTemplateVersion.testTemplate.name", title: "Test Name" },
  ];

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <p>Loading completed tests...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">All Completed Tests</h1>
        <Button variant="outline" asChild>
          <Link to="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {error && <ApiErrorDisplay error={error} className="mb-4" />}

      <Card>
        <CardHeader>
          <CardTitle>Completed Psychological Tests ({tests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {tests.length > 0 ? (
            <DataTable
              columns={columns}
              data={tests}
              searchableColumns={searchableColumns}
              searchPlaceholder="Search tests by patient name, email, or test name..."
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No completed tests found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
