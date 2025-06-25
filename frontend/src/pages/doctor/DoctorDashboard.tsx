import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  ScrollText,
  FileText,
  MessageSquare,
  UserRound,
  Calendar,
} from "lucide-react";

const NotImplementedCard = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <Card className={`bg-red-50 border-red-100 ${className}`}>{children}</Card>
  );
};

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Doctor Dashboard</h1>
      <p className="mb-8">
        Welcome, Dr. {user?.firstName || "User"}! Here you can manage patient
        assessments, notes, and tests.
      </p>

      {error && <ApiErrorDisplay error={error} className="mb-6" />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Assessment Forms Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Assessment Forms
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Manage psychological assessment forms
            </p>
            <div className="space-y-2">
              <Link to="/psychological-forms">
                <Button className="w-full">View All Forms</Button>
              </Link>
              <Link to="/psychological-forms/create">
                <Button className="w-full" variant="outline">
                  Create New Form
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Patient Tests Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Patient Tests</CardTitle>
            <ScrollText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Manage psychological tests for patients
            </p>
            <div className="space-y-2">
              <Link to="/patient-tests">
                <Button className="w-full">View Patient Tests</Button>
              </Link>
              <Link to="/patient-tests/assign">
                <Button className="w-full" variant="outline">
                  Assign New Test
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Patient Notes Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Patient Notes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Create and manage notes for patient appointments
            </p>
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => navigate("/doctor/patient-notes")}
              >
                View Patient Notes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Medical Notices Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Medical Notices
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Create and manage psychological notices for patients
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => navigate("/doctor/notices")}
                className="w-full"
              >
                Manage Notices
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Patient Management Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Patients</CardTitle>
            <UserRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              View and manage your patients
            </p>
            <div className="space-y-2">
              <Link to="/doctor/patients">
                <Button className="w-full">View Patients</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Services Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Services</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              View and manage your appointments and services
            </p>
            <div className="space-y-2">
              <Link to="/doctor/services">
                <Button className="w-full">View Services</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Patient Feedback Card - Move this inside the grid */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Patient Feedback
          </CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            View feedback from patients
          </p>
          <div className="space-y-2">
            <Link to="/doctor/feedback">
              <Button className="w-full">View All Feedback</Button>
            </Link>
            <Link to="/doctor/feedback/request">
              <Button className="w-full" variant="outline">
                Request New Feedback
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
