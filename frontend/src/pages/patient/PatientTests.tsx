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
import { Eye, FileCheck, FileQuestion, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

interface TestInstance {
  test_instance_id: number;
  testStartDate: string | null;
  testStopDate: string | null;
  testTemplateVersion: {
    testTemplate: {
      name: string;
    };
  };
}

export default function PatientTests() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pendingTests, setPendingTests] = useState<TestInstance[]>([]);
  const [completedTests, setCompletedTests] = useState<TestInstance[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatientTests = async () => {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);

        const response = await api.get(`/tests/patient/my-tests`);
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
  }, [user]);

  const handleTakeTest = (testId: number) => {
    navigate(`/patient/tests/take/${testId}`);
  };

  const handleViewTest = (testId: number) => {
    // Navigate to the test results page for patients
    navigate(`/patient/tests/results/${testId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <p>Loading your tests...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Psychological Tests</h1>
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
              <CardTitle>Pending Tests</CardTitle>
              <CardDescription>
                These are the tests that have been assigned to you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingTests.length === 0 ? (
                <div className="text-center p-6">
                  <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">
                    You have no pending tests.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test Name</TableHead>
                      <TableHead>Assigned Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingTests.map((test) => (
                      <TableRow key={test.test_instance_id}>
                        <TableCell>
                          {test.testTemplateVersion.testTemplate.name}
                        </TableCell>
                        <TableCell>
                          {test.testStartDate
                            ? format(
                                new Date(test.testStartDate),
                                "MMM d, yyyy"
                              )
                            : "Not Started"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleTakeTest(test.test_instance_id)
                            }
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Start Test
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
              <CardTitle>Completed Tests</CardTitle>
              <CardDescription>
                These are the tests you have completed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedTests.length === 0 ? (
                <div className="text-center p-6">
                  <FileCheck className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">
                    You have not completed any tests yet.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test Name</TableHead>
                      <TableHead>Completed Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedTests.map((test) => (
                      <TableRow key={test.test_instance_id}>
                        <TableCell>
                          {test.testTemplateVersion.testTemplate.name}
                        </TableCell>
                        <TableCell>
                          {test.testStopDate
                            ? format(new Date(test.testStopDate), "MMM d, yyyy")
                            : "N/A"}
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
