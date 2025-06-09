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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import {
  Eye,
  FileCheck,
  FileQuestion,
  PlusCircle,
  ArrowUpRight,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

// Interfaces based on your Prisma schema
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
    };
  };
  testTemplateVersion: {
    version: number;
    testTemplate: {
      test_template_id: number;
      name: string;
    };
  };
}

export default function PatientTests() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pendingTests, setPendingTests] = useState<TestInstance[]>([]);
  const [completedTests, setCompletedTests] = useState<TestInstance[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatientTests = async () => {
      try {
        setLoading(true);
        setError(null);

        // Just fetch all tests without role restrictions
        const response = await api.get("/tests");

        // Split tests into pending and completed
        const allTests: TestInstance[] = response.data;
        const completed = allTests.filter((test) => test.testStopDate);
        const pending = allTests.filter((test) => !test.testStopDate);

        setCompletedTests(completed);
        setPendingTests(pending);
      } catch (err: any) {
        console.error("Error fetching patient tests:", err);
        setError(err.message || "Failed to load patient tests");
      } finally {
        setLoading(false);
      }
    };

    fetchPatientTests();
  }, []);

  const handleViewTest = (testId: number) => {
    navigate(`/patient-tests/${testId}`);
  };

  const handleAssignNewTest = () => {
    navigate("/patient-tests/assign");
  };

  const handleViewForms = () => {
    navigate("/psychological-forms");
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <p>Loading patient tests...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Patient Tests</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleViewForms}>
            <FileCheck className="mr-2 h-4 w-4" />
            Manage Forms
          </Button>
          <Button onClick={handleAssignNewTest}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Assign New Test
          </Button>
        </div>
      </div>

      {error && <ApiErrorDisplay error={error} className="mb-6" />}

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">
            Pending Tests <Badge className="ml-2">{pendingTests.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed Tests{" "}
            <Badge className="ml-2">{completedTests.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Patient Tests</CardTitle>
              <CardDescription>
                Tests that have been assigned but not yet completed by patients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingTests.length === 0 ? (
                <div className="text-center p-6">
                  <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">
                    No pending tests found
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleAssignNewTest}
                  >
                    Assign a test to a patient
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Test Name</TableHead>
                      <TableHead>Assigned Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingTests.map((test) => (
                      <TableRow key={test.test_instance_id}>
                        <TableCell>
                          {test.patient.user.first_name}{" "}
                          {test.patient.user.last_name}
                        </TableCell>
                        <TableCell>
                          {test.testTemplateVersion.testTemplate.name}
                        </TableCell>
                        <TableCell>
                          {test.testStartDate
                            ? format(
                                new Date(test.testStartDate),
                                "MMM d, yyyy"
                              )
                            : "Not started"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">Pending</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleViewTest(test.test_instance_id)
                            }
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Patient Tests</CardTitle>
              <CardDescription>
                Tests that have been completed by patients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedTests.length === 0 ? (
                <div className="text-center p-6">
                  <FileCheck className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">
                    No completed tests found
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Test Name</TableHead>
                      <TableHead>Completed Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedTests.map((test) => (
                      <TableRow key={test.test_instance_id}>
                        <TableCell>
                          {test.patient.user.first_name}{" "}
                          {test.patient.user.last_name}
                        </TableCell>
                        <TableCell>
                          {test.testTemplateVersion.testTemplate.name}
                        </TableCell>
                        <TableCell>
                          {test.testStopDate &&
                            format(new Date(test.testStopDate), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleViewTest(test.test_instance_id)
                            }
                          >
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                            View Results
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
