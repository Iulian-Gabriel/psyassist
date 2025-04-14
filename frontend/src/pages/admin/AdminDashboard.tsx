import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchAdminStats } from "@/services/adminService";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import { Users, UserCog, Activity } from "lucide-react"; // Import icons

export default function AdminDashboard() {
  const [stats, setStats] = useState<{
    totalUsers: number;
    totalDoctors: number;
    totalPatients: number;
  } | null>(null);
  //   const [appointments, setAppointments] = useState<
  //     {
  //       service_id: string;
  //       service_type: string;
  //       start_time: string;
  //       status: string;
  //       doctor: {
  //         employee: {
  //           user: {
  //             first_name: string;
  //             last_name: string;
  //           };
  //         };
  //       };
  //       serviceParticipants: Array<{
  //         patient: {
  //           user: {
  //             first_name: string;
  //             last_name: string;
  //           };
  //         };
  //       }>;
  //     }[]
  //   >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorStatusCode, setErrorStatusCode] = useState<number | undefined>(
    undefined
  );

  useEffect(() => {
    const getStats = async () => {
      try {
        setLoading(true);
        const data = await fetchAdminStats();
        setStats(data.stats);
        // setAppointments(data.recentAppointments);
        setError(null);
      } catch (err: unknown) {
        console.error("Failed to fetch admin stats:", err);

        let errorMessage = "Failed to load dashboard data.";
        let statusCode: number | undefined = undefined;

        if (err && typeof err === "object") {
          if ("response" in err) {
            const response = (
              err as {
                response: { status?: number; data?: { message?: string } };
              }
            ).response;
            statusCode = response?.status;
            errorMessage = response?.data?.message || errorMessage;
          } else if ("message" in err) {
            errorMessage = (err as Error).message;
          }
        }

        setError(errorMessage);
        setErrorStatusCode(statusCode);
      } finally {
        setLoading(false);
      }
    };

    getStats();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {error && <ApiErrorDisplay error={error} statusCode={errorStatusCode} />}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Registered accounts in the system
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Doctors</CardTitle>
              <UserCog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDoctors}</div>
              <p className="text-xs text-muted-foreground">
                Medical staff available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Patients</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPatients}</div>
              <p className="text-xs text-muted-foreground">
                Registered patients
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Users Management</CardTitle>
            <CardDescription>Manage users and their roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link to="/admin/users">
                <Button className="w-full">View All Users</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee Management</CardTitle>
            <CardDescription>Manage doctors and staff</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link to="/admin/employees">
                <Button className="w-full">View All Employees</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
            <CardDescription>
              Manage consultations and group services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link to="/admin/services">
                <Button className="w-full">View All Services</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
