import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import api from "@/services/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ClipboardList,
  ScrollText,
  FileText,
  MessageSquare,
  UserRound,
  Calendar,
  Heart,
  Activity,
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  CalendarDays,
  AlertCircle,
  CheckCircle,
  Stethoscope,
  Brain,
  PlusCircle,
  Eye,
} from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";

// Interface for appointment data - UPDATED to match actual API response
interface Appointment {
  service_id: number;
  start_time: string;
  end_time: string;
  status: string;
  service_type: string;
  serviceParticipants?: Array<{
    patient: {
      user: {
        first_name: string;
        last_name: string;
      };
    };
  }>;
  patient?: {
    user: {
      first_name: string;
      last_name: string;
    };
  };
}

// Interface for dashboard statistics - UPDATED
interface DoctorDashboardStats {
  todayAppointments: number;
  weekAppointments: number;
  totalPatients: number;
  completedThisWeek: number;
  pendingTests: number; // CHANGED from pendingNotes to pendingTests
  upcomingAppointments: number;
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

// Simple Pie Chart Component
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

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const [stats, setStats] = useState<DoctorDashboardStats>({
    todayAppointments: 0,
    weekAppointments: 0,
    totalPatients: 0,
    completedThisWeek: 0,
    pendingTests: 0, // CHANGED from pendingNotes to pendingTests
    upcomingAppointments: 0,
  });
  const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>(
    []
  );
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [weeklyActivityData, setWeeklyActivityData] = useState([
    { label: "Mon", value: 0 },
    { label: "Tue", value: 0 },
    { label: "Wed", value: 0 },
    { label: "Thu", value: 0 },
    { label: "Fri", value: 0 },
    { label: "Sat", value: 0 },
    { label: "Sun", value: 0 },
  ]);
  const [patientFeedbackRating, setPatientFeedbackRating] = useState(0);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Get doctor profile info
        try {
          const doctorResponse = await api.get("/doctor/profile");
          setDoctorInfo(doctorResponse.data);
        } catch (err) {
          console.error("Error loading doctor profile:", err);
        }

        // 2. Get doctor's services/appointments
        try {
          const servicesResponse = await api.get("/doctor/current/services");
          const allServices = servicesResponse.data || [];

          // Filter today's appointments
          const today = format(new Date(), "yyyy-MM-dd");
          const todayAppts = allServices.filter(
            (service: any) =>
              format(new Date(service.start_time), "yyyy-MM-dd") === today
          );

          // Filter this week's appointments
          const weekStart = format(startOfWeek(new Date()), "yyyy-MM-dd");
          const weekEnd = format(endOfWeek(new Date()), "yyyy-MM-dd");
          const weekAppts = allServices.filter((service: any) => {
            const serviceDate = format(
              new Date(service.start_time),
              "yyyy-MM-dd"
            );
            return serviceDate >= weekStart && serviceDate <= weekEnd;
          });

          // Calculate statistics
          const completed = weekAppts.filter(
            (s: any) => s.status === "Completed"
          ).length;
          const upcoming = allServices.filter(
            (s: any) =>
              s.status === "Scheduled" && new Date(s.start_time) > new Date()
          ).length;

          setStats((prev) => ({
            ...prev,
            todayAppointments: todayAppts.length,
            weekAppointments: weekAppts.length,
            completedThisWeek: completed,
            upcomingAppointments: upcoming,
          }));

          setTodaysAppointments(todayAppts);

          // Generate weekly activity data
          const dailyData = [
            { label: "Mon", value: 0 },
            { label: "Tue", value: 0 },
            { label: "Wed", value: 0 },
            { label: "Thu", value: 0 },
            { label: "Fri", value: 0 },
            { label: "Sat", value: 0 },
            { label: "Sun", value: 0 },
          ];

          weekAppts.forEach((appt: any) => {
            const dayIndex = new Date(appt.start_time).getDay();
            const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
              dayIndex
            ];
            const dayData = dailyData.find((d) => d.label === dayName);
            if (dayData) dayData.value++;
          });

          setWeeklyActivityData(dailyData);

          // Get unique patients count
          const uniquePatients = new Set();
          allServices.forEach((service: any) => {
            if (service.serviceParticipants && service.serviceParticipants[0]) {
              uniquePatients.add(
                service.serviceParticipants[0].patient.patient_id
              );
            }
          });

          setStats((prev) => ({ ...prev, totalPatients: uniquePatients.size }));
        } catch (err) {
          console.error("Error loading doctor services:", err);
        }

        // 3. Get REAL pending tests count
        try {
          const pendingTestsResponse = await api.get("/tests/pending");
          setStats((prev) => ({
            ...prev,
            pendingTests: pendingTestsResponse.data.length || 0,
          }));
        } catch (err) {
          console.error("Error loading pending tests:", err);
          setStats((prev) => ({ ...prev, pendingTests: 0 }));
        }

        // 4. Get REAL recent activity
        try {
          const activityResponse = await api.get(
            "/dashboard/doctor/recent-activity"
          );
          setRecentActivity(activityResponse.data || []);
        } catch (err) {
          console.error("Error loading recent activity:", err);
          // Fallback to constructing from other data
          setRecentActivity([]);
        }

        // 5. Get REAL patient feedback rating
        try {
          const feedbackResponse = await api.get("/feedback/doctor/average");
          const rating = feedbackResponse.data.averageRating || 0;
          setPatientFeedbackRating(rating);
        } catch (err) {
          console.error("Error loading feedback rating:", err);
          setPatientFeedbackRating(0);
        }
      } catch (err) {
        console.error("Error loading doctor dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // UPDATED: Prepare chart data with pendingTests
  const appointmentStatusData = [
    { label: "Scheduled", value: stats.upcomingAppointments },
    { label: "Completed", value: stats.completedThisWeek },
    { label: "Pending Tests", value: stats.pendingTests }, // UPDATED label
  ];

  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days !== 1 ? "s" : ""} ago`;
    }
  };

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
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, Dr. {user?.firstName || "User"}!
              </h1>
              <p className="text-gray-600">
                {doctorInfo?.specialization
                  ? `${doctorInfo.specialization} - `
                  : ""}
                Your patient care dashboard and clinical insights
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 p-4 rounded-xl border border-blue-200/20">
            <div className="flex items-center space-x-2">
              <Badge className="bg-blue-100 text-blue-800">
                {doctorInfo?.specialization || "Clinical Psychologist"}
              </Badge>
              <span className="text-sm text-gray-600">
                Providing exceptional mental health care
              </span>
            </div>
          </div>
        </div>

        {error && <ApiErrorDisplay error={error} className="mb-6" />}

        {/* Stats Overview - UPDATED FOURTH CARD */}
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
                <Clock className="w-4 h-4 text-blue-500 mr-1" />
                <span className="text-blue-600">
                  {stats.upcomingAppointments} upcoming
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">
                    My Patients
                  </p>
                  <p className="text-3xl font-bold text-green-900">
                    {stats.totalPatients}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <Heart className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600">Active cases</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">
                    Completed This Week
                  </p>
                  <p className="text-3xl font-bold text-purple-900">
                    {stats.completedThisWeek}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-500" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600">Great progress!</span>
              </div>
            </CardContent>
          </Card>

          {/* UPDATED: Pending Tests Card */}
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">
                    Pending Tests
                  </p>
                  <p className="text-3xl font-bold text-orange-900">
                    {stats.pendingTests}
                  </p>
                </div>
                <Brain className="w-8 h-8 text-orange-500" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                {stats.pendingTests > 0 ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-orange-500 mr-1" />
                    <span className="text-orange-600">Awaiting completion</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-600">All tests completed!</span>
                  </>
                )}
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
              <CardDescription>Your appointments this week</CardDescription>
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
                <span>Clinical Overview</span>
              </CardTitle>
              <CardDescription>Current caseload status</CardDescription>
            </CardHeader>
            <CardContent>
              <SimplePieChart
                data={appointmentStatusData}
                title="Case Status"
              />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Today's Schedule - REORDERED */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions - REORDERED to prioritize Patient Tests */}
          <Card className="lg:col-span-2 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
              <CardDescription>Common clinical tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Link to="/doctor/services">
                  <Button className="w-full h-20 flex flex-col items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                    <Calendar className="w-6 h-6 mb-2" />
                    <span className="text-sm">My Services</span>
                  </Button>
                </Link>

                <Link to="/doctor/patients">
                  <Button className="w-full h-20 flex flex-col items-center justify-center bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                    <UserRound className="w-6 h-6 mb-2" />
                    <span className="text-sm">My Patients</span>
                  </Button>
                </Link>

                {/* UPDATED: Moved Patient Tests to more prominent position */}
                <Link to="/patient-tests">
                  <Button className="w-full h-20 flex flex-col items-center justify-center bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
                    <Brain className="w-6 h-6 mb-2" />
                    <span className="text-sm">Patient Tests</span>
                  </Button>
                </Link>

                <Link to="/psychological-forms">
                  <Button className="w-full h-20 flex flex-col items-center justify-center bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                    <ClipboardList className="w-6 h-6 mb-2" />
                    <span className="text-sm">Assessment Forms</span>
                  </Button>
                </Link>

                {/* UPDATED: Moved Patient Notes to less prominent position */}
                <Link to="/doctor/patient-notes">
                  <Button className="w-full h-20 flex flex-col items-center justify-center bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700">
                    <FileText className="w-6 h-6 mb-2" />
                    <span className="text-sm">Patient Notes</span>
                  </Button>
                </Link>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full h-20 flex flex-col items-center justify-center bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700">
                      <Eye className="w-6 h-6 mb-2" />
                      <span className="text-sm">Today's Schedule</span>
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
                        Your appointments for today
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
                                  {/* Handle both possible data structures */}
                                  {(() => {
                                    // Try direct patient property first
                                    if (
                                      appt.patient?.user?.first_name &&
                                      appt.patient?.user?.last_name
                                    ) {
                                      return `${appt.patient.user.first_name} ${appt.patient.user.last_name}`;
                                    }
                                    // Try serviceParticipants structure
                                    if (
                                      appt.serviceParticipants?.[0]?.patient
                                        ?.user?.first_name &&
                                      appt.serviceParticipants?.[0]?.patient
                                        ?.user?.last_name
                                    ) {
                                      return `${appt.serviceParticipants[0].patient.user.first_name} ${appt.serviceParticipants[0].patient.user.last_name}`;
                                    }
                                    return "Patient information not available";
                                  })()}
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

          {/* UPDATED: Recent Activity with enhanced test activities */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                Recent Activity
              </CardTitle>
              <CardDescription>Latest clinical updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === "appointment"
                          ? "bg-blue-100"
                          : activity.type === "test"
                          ? "bg-purple-100"
                          : activity.type === "note"
                          ? "bg-green-100"
                          : "bg-orange-100"
                      }`}
                    >
                      {activity.type === "appointment" ? (
                        <Calendar className="w-4 h-4 text-blue-600" />
                      ) : activity.type === "test" ? (
                        <Brain className="w-4 h-4 text-purple-600" />
                      ) : activity.type === "note" ? (
                        <FileText className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 font-medium">
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

        {/* UPDATED: Clinical Tools Section with Test Management */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <span>Test Management</span>
              </CardTitle>
              <CardDescription>
                Psychological assessments and test results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending Tests</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-lg font-bold text-orange-500">
                      {stats.pendingTests}
                    </span>
                    <span className="text-sm text-gray-500">awaiting</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/patient-tests">
                    <Button className="w-full" variant="outline" size="sm">
                      <Brain className="w-4 h-4 mr-2" />
                      View Tests
                    </Button>
                  </Link>
                  <Link to="/patient-tests/assign">
                    <Button className="w-full" variant="outline" size="sm">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Assign Test
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <span>Patient Feedback</span>
              </CardTitle>
              <CardDescription>
                Reviews and feedback from your patients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Rating</span>
                  <div className="flex items-center space-x-1">
                    {patientFeedbackRating > 0 ? (
                      <>
                        <span className="text-lg font-bold text-yellow-500">
                          {patientFeedbackRating.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500">/ 5.0</span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">
                        No ratings yet
                      </span>
                    )}
                  </div>
                </div>
                <Link to="/doctor/feedback">
                  <Button className="w-full" variant="outline">
                    View All Feedback
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
