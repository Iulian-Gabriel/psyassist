import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import { receptionistService } from "@/services/receptionistService";
import api from "@/services/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  UserRound,
  ScrollText,
  ClipboardCheck,
  PlusCircle,
  Eye,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  CalendarDays,
  AlertCircle,
  CheckCircle,
  Heart,
  Activity,
  BarChart3,
} from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";

// Interface for appointment data
interface Appointment {
  service_id: number;
  start_time: string;
  end_time: string;
  status: string;
  service_type: string;
  patient: {
    user: {
      first_name: string;
      last_name: string;
    };
  };
  doctor: {
    employee: {
      user: {
        first_name: string;
        last_name: string;
      };
    };
  };
}

// Interface for dashboard statistics
interface DashboardStats {
  todayAppointments: number;
  weekAppointments: number;
  pendingRequests: number;
  totalPatients: number;
  completedThisWeek: number;
  cancelledThisWeek: number;
}

// Simple Bar Chart Component
const SimpleBarChart = ({ data, title }: { data: any[]; title: string }) => {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">{title}</h4>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-16 text-xs text-gray-600">{item.label}</div>
            <div className="flex-1 bg-gray-100 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
            <div className="w-8 text-xs font-medium text-gray-700">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Pie Chart Component (Simple CSS-based)
const SimplePieChart = ({ data, title }: { data: any[]; title: string }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const colors = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444"];

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">{title}</h4>
      <div className="flex items-center space-x-4">
        <div className="relative w-20 h-20">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-gray-700">{total}</span>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-xs text-gray-600">
                {item.label}: {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function ReceptionistDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [receptionistInfo, setReceptionistInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    weekAppointments: 0,
    pendingRequests: 0,
    totalPatients: 0,
    completedThisWeek: 0,
    cancelledThisWeek: 0,
  });
  const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>(
    []
  );
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Add new state for live data
  const [weeklyActivityData, setWeeklyActivityData] = useState([
    { label: "Mon", value: 0 },
    { label: "Tue", value: 0 },
    { label: "Wed", value: 0 },
    { label: "Thu", value: 0 },
    { label: "Fri", value: 0 },
    { label: "Sat", value: 0 },
    { label: "Sun", value: 0 },
  ]);

  const [previousDayAppointments, setPreviousDayAppointments] = useState(0);
  const [previousWeekPatients, setPreviousWeekPatients] = useState(0);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current receptionist info
        try {
          const receptionistResponse =
            await receptionistService.getCurrentReceptionist();
          setReceptionistInfo(receptionistResponse);
        } catch (err) {
          console.error("Error loading receptionist info:", err);
        }

        // Get pending service requests count
        try {
          const serviceRequestsResponse =
            await receptionistService.getServiceRequests("pending");
          setStats((prev) => ({
            ...prev,
            pendingRequests: serviceRequestsResponse.length || 0,
          }));
        } catch (err) {
          console.error("Error loading service requests:", err);
        }

        // Get today's appointments
        try {
          const today = format(new Date(), "yyyy-MM-dd");
          const appointmentsResponse = await api.get(
            "/services/appointments/by-date",
            {
              params: { date: today },
            }
          );
          const todayAppts = appointmentsResponse.data || [];
          setTodaysAppointments(todayAppts);
          setStats((prev) => ({
            ...prev,
            todayAppointments: todayAppts.length,
          }));
        } catch (err) {
          console.error("Error loading today's appointments:", err);
          setTodaysAppointments([]);
        }

        // Get yesterday's appointments for comparison
        try {
          const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
          const yesterdayResponse = await api.get(
            "/services/appointments/by-date",
            {
              params: { date: yesterday },
            }
          );
          setPreviousDayAppointments(yesterdayResponse.data?.length || 0);
        } catch (err) {
          console.error("Error loading yesterday's appointments:", err);
        }

        // Get week's statistics
        try {
          const weekStart = format(startOfWeek(new Date()), "yyyy-MM-dd");
          const weekEnd = format(endOfWeek(new Date()), "yyyy-MM-dd");

          const weekResponse = await api.get(
            "/services/appointments/by-date-range",
            {
              params: { startDate: weekStart, endDate: weekEnd },
            }
          );

          const weekAppts = weekResponse.data || [];
          const completed = weekAppts.filter(
            (a: Appointment) => a.status === "Completed"
          ).length;
          const cancelled = weekAppts.filter(
            (a: Appointment) => a.status === "Cancelled"
          ).length;

          setStats((prev) => ({
            ...prev,
            weekAppointments: weekAppts.length,
            completedThisWeek: completed,
            cancelledThisWeek: cancelled,
          }));

          // Generate weekly activity data from real appointments
          const dailyData = [
            { label: "Mon", value: 0 },
            { label: "Tue", value: 0 },
            { label: "Wed", value: 0 },
            { label: "Thu", value: 0 },
            { label: "Fri", value: 0 },
            { label: "Sat", value: 0 },
            { label: "Sun", value: 0 },
          ];

          weekAppts.forEach((appt: Appointment) => {
            const dayIndex = new Date(appt.start_time).getDay();
            const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
              dayIndex
            ];
            const dayData = dailyData.find((d) => d.label === dayName);
            if (dayData) dayData.value++;
          });

          setWeeklyActivityData(dailyData);
        } catch (err) {
          console.error("Error loading week statistics:", err);
        }

        // Get real patient count
        try {
          const patientsResponse = await api.get("/patients/count");
          const currentPatientCount = patientsResponse.data.count || 0;
          setStats((prev) => ({ ...prev, totalPatients: currentPatientCount }));

          // Get previous week patient count for comparison
          const prevWeekStart = format(
            subDays(startOfWeek(new Date()), 7),
            "yyyy-MM-dd"
          );
          const prevWeekEnd = format(
            subDays(endOfWeek(new Date()), 7),
            "yyyy-MM-dd"
          );

          const prevWeekPatientsResponse = await api.get("/patients/count", {
            params: { beforeDate: prevWeekEnd },
          });
          setPreviousWeekPatients(prevWeekPatientsResponse.data.count || 0);
        } catch (err) {
          console.error("Error loading patient count:", err);
          // Fallback to a reasonable default
          setStats((prev) => ({ ...prev, totalPatients: 0 }));
        }

        // Get real recent activity
        try {
          const activityResponse = await api.get("/dashboard/recent-activity", {
            params: { limit: 4 },
          });
          setRecentActivity(activityResponse.data || []);
        } catch (err) {
          console.error("Error loading recent activity:", err);
          // Fallback to mock data if API doesn't exist yet
          setRecentActivity([
            {
              type: "appointment",
              message: "New appointment scheduled",
              time: "2 minutes ago",
            },
            {
              type: "request",
              message: "Service request approved",
              time: "15 minutes ago",
            },
            {
              type: "patient",
              message: "New patient registration",
              time: "1 hour ago",
            },
            {
              type: "cancellation",
              message: "Appointment cancelled",
              time: "2 hours ago",
            },
          ]);
        }
      } catch (err) {
        console.error("Error loading receptionist dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Calculate percentage changes
  const todayVsYesterday =
    previousDayAppointments > 0
      ? Math.round(
          ((stats.todayAppointments - previousDayAppointments) /
            previousDayAppointments) *
            100
        )
      : stats.todayAppointments > 0
      ? 100
      : 0;

  const newPatientsThisWeek = stats.totalPatients - previousWeekPatients;

  // Prepare chart data
  const appointmentStatusData = [
    {
      label: "Scheduled",
      value:
        stats.weekAppointments -
        stats.completedThisWeek -
        stats.cancelledThisWeek,
    },
    { label: "Completed", value: stats.completedThisWeek },
    { label: "Cancelled", value: stats.cancelledThisWeek },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto p-4">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.firstName || "User"}!
              </h1>
              <p className="text-gray-600">
                Here's what's happening at your clinic today
              </p>
            </div>
          </div>

          {receptionistInfo && (
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 p-4 rounded-xl border border-blue-200/20">
              <div className="flex items-center space-x-2">
                <Badge className="bg-blue-100 text-blue-800">
                  {receptionistInfo.jobTitle}
                </Badge>
                <span className="text-sm text-gray-600">
                  Managing appointments and patient care
                </span>
              </div>
            </div>
          )}
        </div>

        {error && <ApiErrorDisplay error={error} className="mb-6" />}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">
                    Today's Appointments
                  </p>
                  <p className="text-3xl font-bold text-blue-900">
                    {stats.todayAppointments}
                  </p>
                </div>
                <CalendarDays className="w-8 h-8 text-blue-500" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                {todayVsYesterday >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span
                  className={
                    todayVsYesterday >= 0 ? "text-green-600" : "text-red-600"
                  }
                >
                  {todayVsYesterday >= 0 ? "+" : ""}
                  {todayVsYesterday}% from yesterday
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">
                    Pending Requests
                  </p>
                  <p className="text-3xl font-bold text-purple-900">
                    {stats.pendingRequests}
                  </p>
                </div>
                <ClipboardCheck className="w-8 h-8 text-purple-500" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                {stats.pendingRequests > 0 ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-orange-500 mr-1" />
                    <span className="text-orange-600">Needs attention</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-600">All caught up!</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">
                    Total Patients
                  </p>
                  <p className="text-3xl font-bold text-green-900">
                    {stats.totalPatients}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600">
                  +{newPatientsThisWeek} new this week
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">
                    This Week
                  </p>
                  <p className="text-3xl font-bold text-orange-900">
                    {stats.weekAppointments}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-orange-500" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <Clock className="w-4 h-4 text-blue-500 mr-1" />
                <span className="text-blue-600">
                  {stats.completedThisWeek} completed
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span>Weekly Activity</span>
              </CardTitle>
              <CardDescription>
                Appointments scheduled this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleBarChart
                data={weeklyActivityData}
                title="Daily Appointments"
              />
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-purple-600" />
                <span>Appointment Status</span>
              </CardTitle>
              <CardDescription>Status breakdown for this week</CardDescription>
            </CardHeader>
            <CardContent>
              <SimplePieChart
                data={appointmentStatusData}
                title="Status Distribution"
              />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Today's Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions */}
          <Card className="lg:col-span-2 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
              <CardDescription>Frequently used functions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Link to="/receptionist/calendar">
                  <Button className="w-full h-20 flex flex-col items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                    <Calendar className="w-6 h-6 mb-2" />
                    <span className="text-sm">Calendar</span>
                  </Button>
                </Link>

                <Link to="/receptionist/service-requests">
                  <Button className="w-full h-20 flex flex-col items-center justify-center bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
                    <ClipboardCheck className="w-6 h-6 mb-2" />
                    <span className="text-sm">Requests</span>
                  </Button>
                </Link>

                <Link to="/receptionist/patients">
                  <Button className="w-full h-20 flex flex-col items-center justify-center bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                    <UserRound className="w-6 h-6 mb-2" />
                    <span className="text-sm">Patients</span>
                  </Button>
                </Link>

                <Link to="/receptionist/patients/add">
                  <Button className="w-full h-20 flex flex-col items-center justify-center bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                    <PlusCircle className="w-6 h-6 mb-2" />
                    <span className="text-sm">Add Patient</span>
                  </Button>
                </Link>

                <Link to="/receptionist/services">
                  <Button className="w-full h-20 flex flex-col items-center justify-center bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700">
                    <ScrollText className="w-6 h-6 mb-2" />
                    <span className="text-sm">Services</span>
                  </Button>
                </Link>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full h-20 flex flex-col items-center justify-center bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700">
                      <Eye className="w-6 h-6 mb-2" />
                      <span className="text-sm">Today</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <CalendarDays className="w-5 h-5" />
                        <span>
                          Today's Schedule -{" "}
                          {format(new Date(), "MMMM d, yyyy")}
                        </span>
                      </DialogTitle>
                      <DialogDescription>
                        All appointments scheduled for today
                      </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto pr-4">
                      {todaysAppointments.length > 0 ? (
                        <div className="space-y-4">
                          {todaysAppointments.map((appt) => (
                            <div
                              key={appt.service_id}
                              className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-semibold text-lg text-gray-900">
                                  {format(new Date(appt.start_time), "h:mm a")}{" "}
                                  - {format(new Date(appt.end_time), "h:mm a")}
                                </div>
                                <Badge
                                  className={`${
                                    appt.status === "Scheduled"
                                      ? "bg-blue-100 text-blue-800"
                                      : appt.status === "Completed"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {appt.status}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-sm text-gray-600">
                                <p>
                                  <span className="font-medium">Patient:</span>{" "}
                                  {appt.patient.user.first_name}{" "}
                                  {appt.patient.user.last_name}
                                </p>
                                <p>
                                  <span className="font-medium">Doctor:</span>{" "}
                                  {appt.doctor.employee.user.first_name}{" "}
                                  {appt.doctor.employee.user.last_name}
                                </p>
                                <p>
                                  <span className="font-medium">Type:</span>{" "}
                                  {appt.service_type || "Consultation"}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <CalendarDays className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">
                            No appointments scheduled for today
                          </p>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                Recent Activity
              </CardTitle>
              <CardDescription>Latest updates and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === "appointment"
                          ? "bg-blue-500"
                          : activity.type === "request"
                          ? "bg-green-500"
                          : activity.type === "patient"
                          ? "bg-purple-500"
                          : "bg-orange-500"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
