import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileQuestion, Clipboard, Calendar, Files } from "lucide-react";

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Patient Dashboard</h1>
      <p className="mb-8">
        Welcome, {user?.firstName || "Patient"}! Here you can manage your
        appointments, view test results, and provide feedback.
      </p>

      {error && <ApiErrorDisplay error={error} className="mb-6" />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Psychological Tests Card */}
        {/* Psychological Tests Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Psychological Tests
            </CardTitle>
            <FileQuestion className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Complete psychological tests assigned by your doctor
            </p>
            <div className="space-y-2">
              <Link to="/patient/my-tests">
                <Button className="w-full">View My Tests</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Initial Assessment Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Initial Assessment
            </CardTitle>
            <Clipboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Complete your initial assessment form
            </p>
            <div className="space-y-2">
              <Link to="/patient/initial-form">
                <Button className="w-full">Initial Assessment Form</Button>
              </Link>
              <Link to="/patient/initial-form/view">
                <Button className="w-full" variant="outline">
                  View Your Responses
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Card */}
        <Card>
          <CardHeader>
            <CardTitle>Provide Feedback</CardTitle>
            <CardDescription>
              Rate services and submit feedback to doctors
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <div className="space-y-1">
              <p>Submit feedback for psychological services</p>
              <p className="text-sm text-muted-foreground">
                Help us improve with your input
              </p>
            </div>
            <Button onClick={() => navigate("/patient/feedback")}>
              Rate Services
            </Button>
          </CardContent>
        </Card>

        {/* My Documents Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Documents</CardTitle>
            <Files className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Access your medical documents and notices
            </p>
            <div className="space-y-2">
              <Link to="/patient/documents/tests">
                <Button className="w-full">Test Results</Button>
              </Link>
              <Link to="/patient/documents/notices">
                <Button className="w-full" variant="outline">
                  Doctor Notices
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Appointment Requests Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Appointment Requests
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Request and manage your appointments
            </p>
            <div className="space-y-2">
              <Link to="/patient/appointments/request">
                <Button className="w-full">Request Appointment</Button>
              </Link>
              <Link to="/patient/appointments/history">
                <Button className="w-full" variant="outline">
                  Appointment History
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
