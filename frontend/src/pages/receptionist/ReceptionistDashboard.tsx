import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, UserRound, ScrollText, ClipboardCheck } from "lucide-react";

export default function ReceptionistDashboard() {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Receptionist Dashboard</h1>
      <p className="mb-8">
        Welcome, {user?.firstName || "User"}! Here you can manage appointments
        and patient records.
      </p>

      {error && <ApiErrorDisplay error={error} className="mb-6" />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Appointment Calendar Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Appointment Scheduling
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              View and manage the appointment calendar
            </p>
            <div className="space-y-2">
              <Link to="/admin/appointments">
                <Button className="w-full">Appointment Calendar</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Patient Management Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Patient Management
            </CardTitle>
            <UserRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Manage patients and their records
            </p>
            <div className="space-y-2">
              <Link to="/receptionist/patients">
                <Button className="w-full">View All Patients</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Services Management Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Services</CardTitle>
            <ScrollText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Manage consultations and group services
            </p>
            <div className="space-y-2">
              <Link to="/receptionist/services">
                <Button className="w-full">View All Services</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Service Requests Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Service Requests
            </CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Process patient service requests
            </p>
            <div className="space-y-2">
              <Link to="/receptionist/service-requests">
                <Button className="w-full">View Service Requests</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
