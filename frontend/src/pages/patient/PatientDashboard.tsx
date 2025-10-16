import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
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
  FileQuestion,
  Clipboard,
  Calendar,
  Files,
  Heart,
  Activity,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  CalendarDays,
  MessageSquare,
  Users,
  FileText,
  Bell,
  Star,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  startOfWeek,
  endOfWeek,
} from "date-fns";

// Interface for patient dashboard statistics
interface PatientDashboardStats {
  upcomingAppointments: number;
  completedThisMonth: number;
  pendingTests: number;
  totalDocuments: number;
  completedTests: number;
  averageWellnessScore: number;
}

// Interface for appointment data
interface Appointment {
  service_id: number;
  start_time: string;
  end_time: string;
  status: string;
  service_type: string;
  doctor: {
    employee: {
      user: {
        first_name: string;
        last_name: string;
      };
    };
    specialization: string;
  };
}

// Interface for test data
interface TestData {
  test_instance_id: number;
  testStartDate: string;
  testStopDate: string | null;
  testTemplateVersion: {
    testTemplate: {
      name: string;
    };
  };
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
            <span className="text-xs w-12 text-gray-600">{item.label}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                }}
              ></div>
            </div>
            <span className="text-xs font-medium text-gray-700 w-6">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Wellness Score Component
const WellnessScore = ({ score }: { score: number }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Attention";
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="relative w-16 h-16">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white font-bold text-lg">{score}</span>
        </div>
      </div>
      <div>
        <div className={`text-lg font-bold ${getScoreColor(score)}`}>
          {getScoreLabel(score)}
        </div>
        <div className="text-sm text-gray-600">Overall Wellness</div>
      </div>
    </div>
  );
};

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [patientInfo, setPatientInfo] = useState<any>(null);

  const [stats, setStats] = useState<PatientDashboardStats>({
    upcomingAppointments: 0,
    completedThisMonth: 0,
    pendingTests: 0,
    totalDocuments: 0,
    completedTests: 0,
    averageWellnessScore: 0,
  });

  const [upcomingAppointments, setUpcomingAppointments] = useState<
    Appointment[]
  >([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [recentTests, setRecentTests] = useState<TestData[]>([]);
  const [monthlyProgressData, setMonthlyProgressData] = useState([
    { label: "Week 1", value: 0 },
    { label: "Week 2", value: 0 },
    { label: "Week 3", value: 0 },
    { label: "Week 4", value: 0 },
  ]);

  useEffect(() => {
    let isSubscribed = true;

    const loadPatientDashboard = async () => {
      try {
        if (!isSubscribed) return;
        setLoading(true);
        setError(null);

        // Initialize variables to hold the data
        let patientData = null;
        let appointments = [];
        let allAppointments = [];
        let allTests = [];
        let notices = [];
        let completedThisMonth = 0;
        let pendingTests = 0;
        let completedTests = 0;

        // 1. Get patient profile info
        try {
          const patientResponse = await api.get("/patients/current/profile");
          patientData = patientResponse.data;
          setPatientInfo(patientData);
        } catch (err) {
          console.error("Error loading patient profile:", err);
        }

        // 2. Get upcoming appointments (using your existing structure)
        try {
          const appointmentsResponse = await api.get(
            "/patients/appointments/upcoming"
          );
          const rawAppointments = appointmentsResponse.data || [];

          // Transform to match the expected structure
          appointments = rawAppointments.map((appt: any) => ({
            service_id: appt.service_id,
            start_time: appt.start_time,
            end_time: appt.end_time,
            status: appt.status,
            service_type: appt.service_type || "Consultation",
            doctor: {
              employee: {
                user: {
                  first_name: appt.doctor?.name?.split(" ")[1] || "Unknown",
                  last_name: appt.doctor?.name?.split(" ")[2] || "Doctor",
                },
              },
              specialization: appt.doctor?.specialization || "General Practice",
            },
          }));

          setUpcomingAppointments(appointments);
        } catch (err) {
          console.error("Error loading upcoming appointments:", err);
        }

        // 3. Get completed appointments this month (using your existing structure)
        try {
          const historyResponse = await api.get(
            "/patients/appointments/history"
          );
          const rawHistory = historyResponse.data || [];

          // Transform to match expected structure
          allAppointments = rawHistory.map((appt: any) => ({
            service_id: appt.service_id,
            start_time: appt.start_time,
            end_time: appt.end_time,
            status: appt.status,
            service_type: appt.service_type || "Consultation",
            doctor: {
              employee: {
                user: {
                  first_name: appt.doctor?.name?.split(" ")[1] || "Unknown",
                  last_name: appt.doctor?.name?.split(" ")[2] || "Doctor",
                },
              },
              specialization: appt.doctor?.specialization || "General Practice",
            },
          }));

          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();

          completedThisMonth = allAppointments.filter((appt: any) => {
            const apptDate = new Date(appt.start_time);
            return (
              appt.status === "Completed" &&
              apptDate.getMonth() === currentMonth &&
              apptDate.getFullYear() === currentYear
            );
          }).length;
        } catch (err) {
          console.error("Error loading appointment history:", err);
        }

        // 4. Get patient's tests
        try {
          const testsResponse = await api.get("/tests/patient/my-tests");
          allTests = testsResponse.data || [];

          pendingTests = allTests.filter(
            (test: TestData) => !test.testStopDate
          ).length;
          completedTests = allTests.filter(
            (test: TestData) => test.testStopDate
          ).length;

          // Get recent tests (last 3)
          const recentTestsData = allTests
            .sort(
              (a: TestData, b: TestData) =>
                new Date(b.testStartDate).getTime() -
                new Date(a.testStartDate).getTime()
            )
            .slice(0, 3);

          setRecentTests(recentTestsData);
        } catch (err) {
          console.error("Error loading patient tests:", err);
        }

        // 5. Get patient notices/documents
        try {
          const noticesResponse = await api.get("/notices/patient/my-notices");
          notices = noticesResponse.data || [];
        } catch (err) {
          console.error("Error loading patient notices:", err);
        }

        // 6. Calculate wellness score based on REAL data
        const calculatedWellnessScore = Math.min(
          100,
          Math.max(
            0,
            completedTests * 8 + // 8 points per completed test
              completedThisMonth * 12 + // 12 points per completed session
              (pendingTests === 0 ? 15 : 0) + // 15 bonus points if no pending tests
              (appointments.length > 0 ? 10 : 0) + // 10 points for having upcoming appointments
              30 // Base score of 30
          )
        );

        // 7. Generate monthly progress data based on REAL appointments
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        // Get all appointments for current month
        const currentMonthAppointments = allAppointments.filter((appt: any) => {
          const apptDate = new Date(appt.start_time);
          return (
            apptDate.getMonth() === currentMonth &&
            apptDate.getFullYear() === currentYear
          );
        });

        // Divide appointments into weeks (simplified)
        const progressData = [];
        const appointmentsPerWeek = Math.ceil(
          currentMonthAppointments.length / 4
        );

        for (let i = 0; i < 4; i++) {
          const weekAppointments = currentMonthAppointments.slice(
            i * appointmentsPerWeek,
            (i + 1) * appointmentsPerWeek
          );

          progressData.push({
            label: `Week ${i + 1}`,
            value: weekAppointments.length,
          });
        }

        // Ensure we have exactly 4 weeks
        while (progressData.length < 4) {
          progressData.push({
            label: `Week ${progressData.length + 1}`,
            value: 0,
          });
        }

        setMonthlyProgressData(progressData.slice(0, 4));

        // 8. Generate recent activity based on REAL data
        const activities = [];

        // Add upcoming appointment activity
        if (appointments.length > 0) {
          const nextAppt = appointments[0];
          activities.push({
            type: "appointment",
            message: `Upcoming: ${nextAppt.service_type} with ${nextAppt.doctor?.name}`,
            time: format(new Date(nextAppt.start_time), "MMM d 'at' h:mm a"),
            icon: Calendar,
          });
        }

        // Add recent completed appointment
        const recentCompleted = allAppointments
          .filter((appt: any) => appt.status === "Completed")
          .slice(0, 1);

        if (recentCompleted.length > 0) {
          const appt = recentCompleted[0];
          activities.push({
            type: "appointment",
            message: `Completed: ${appt.service_type} session`,
            time: format(new Date(appt.start_time), "MMM d"),
            icon: CheckCircle,
          });
        }

        // Add test activity
        if (allTests.length > 0) {
          const latestTest = allTests[0];
          activities.push({
            type: "test",
            message: `${
              latestTest.testStopDate ? "Completed" : "In progress"
            }: ${latestTest.testTemplateVersion.testTemplate.name}`,
            time: format(new Date(latestTest.testStartDate), "MMM d"),
            icon: FileQuestion,
          });
        }

        // Add document activity
        if (notices.length > 0) {
          activities.push({
            type: "document",
            message: `${notices.length} medical document${
              notices.length > 1 ? "s" : ""
            } available`,
            time: "Recent",
            icon: Files,
          });
        }

        // Add fallback activity if no real data
        if (activities.length === 0) {
          activities.push({
            type: "welcome",
            message:
              "Welcome to your health dashboard! Start by completing your initial assessment.",
            time: "Today",
            icon: Heart,
          });
        }

        setRecentActivity(activities);

        // 9. Update all stats at once
        setStats({
          upcomingAppointments: appointments.length,
          completedThisMonth,
          pendingTests,
          totalDocuments: notices.length,
          completedTests,
          averageWellnessScore: calculatedWellnessScore,
        });
      } catch (err) {
        if (isSubscribed) {
          console.error("Error loading patient dashboard:", err);
          setError("Failed to load dashboard data. Please try again.");
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    loadPatientDashboard();

    // Cleanup function
    return () => {
      isSubscribed = false;
    };
  }, []);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <Activity className="w-12 h-12 text-blue-600 animate-pulse mx-auto mb-4" />
            <p>Loading your health dashboard...</p>
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
                Welcome back, {user?.firstName || "Patient"}!
              </h1>
              <p className="text-gray-600">
                Your personal health and wellness dashboard
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 p-4 rounded-xl border border-blue-200/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge className="bg-blue-100 text-blue-800">Patient</Badge>
                <span className="text-sm text-gray-600">
                  Taking control of your mental health journey
                </span>
              </div>
              <WellnessScore score={stats.averageWellnessScore} />
            </div>
          </div>
        </div>

        {error && <ApiErrorDisplay error={error} className="mb-6" />}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Upcoming Appointments
              </CardTitle>
              <CalendarDays className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.upcomingAppointments}
              </div>
              <p className="text-xs text-gray-600">
                {stats.upcomingAppointments > 0
                  ? "Next appointment soon"
                  : "No upcoming appointments"}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Completed This Month
              </CardTitle>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.completedThisMonth}
              </div>
              <p className="text-xs text-gray-600">Sessions attended</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Tests
              </CardTitle>
              <AlertCircle className="w-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.pendingTests}
              </div>
              <p className="text-xs text-gray-600">
                {stats.pendingTests > 0
                  ? "Tests to complete"
                  : "All tests completed"}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                My Documents
              </CardTitle>
              <Files className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.totalDocuments}
              </div>
              <p className="text-xs text-gray-600">Available documents</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>Monthly Progress</span>
              </CardTitle>
              <CardDescription>
                Your wellness activities over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleBarChart
                data={monthlyProgressData}
                title="Weekly Activity"
              />
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-green-600" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>Your latest health activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <activity.icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
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

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Psychological Tests Card */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
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
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                    View My Tests
                    <Badge className="ml-2 bg-blue-800">
                      {stats.pendingTests}
                    </Badge>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Initial Assessment Card */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
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
                  <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
                    Initial Assessment Form
                  </Button>
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
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-yellow-600" />
                <span>Provide Feedback</span>
              </CardTitle>
              <CardDescription>
                Rate services and submit feedback to doctors
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm">
                  Submit feedback for psychological services
                </p>
                <p className="text-xs text-muted-foreground">
                  Help us improve with your input
                </p>
              </div>
              <Button
                onClick={() => navigate("/patient/feedback")}
                className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800"
              >
                <Star className="w-4 h-4 mr-2" />
                Rate Services
              </Button>
            </CardContent>
          </Card>

          {/* My Documents Card */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                My Documents
              </CardTitle>
              <Files className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Access your medical documents and notices
              </p>
              <div className="space-y-2">
                <Link to="/patient/documents/notices">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
                    <FileText className="w-4 h-4 mr-2" />
                    Doctor Notices
                    <Badge className="ml-2 bg-purple-800">
                      {stats.totalDocuments}
                    </Badge>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Appointment Requests Card */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
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
                  <Button className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800">
                    Request Appointment
                  </Button>
                </Link>
                <Link to="/patient/appointments/history">
                  <Button className="w-full" variant="outline">
                    Appointment History
                  </Button>
                </Link>
                <Link to="/patient/appointments/upcoming">
                  <Button className="w-full" variant="outline">
                    Upcoming Appointments
                    <Badge className="ml-2" variant="outline">
                      {stats.upcomingAppointments}
                    </Badge>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Health Insights Card */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Health Insights
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                View your progress and insights
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Wellness Score:</span>
                  <Badge
                    className={
                      stats.averageWellnessScore >= 80
                        ? "bg-green-100 text-green-800"
                        : stats.averageWellnessScore >= 60
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }
                  >
                    {stats.averageWellnessScore}/100
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Tests Completed:</span>
                  <span className="font-medium">{stats.completedTests}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Sessions This Month:</span>
                  <span className="font-medium">
                    {stats.completedThisMonth}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span>Upcoming Appointments</span>
              </CardTitle>
              <CardDescription>Your scheduled sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingAppointments.slice(0, 3).map((appointment) => {
                  const doctorName = `Dr. ${
                    appointment.doctor?.employee?.user?.first_name || "Unknown"
                  } ${
                    appointment.doctor?.employee?.user?.last_name || "Doctor"
                  }`;
                  const formatted = formatDateTime(appointment.start_time);

                  return (
                    <div
                      key={appointment.service_id}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {appointment.service_type}
                          </h4>
                          <p className="text-sm text-gray-600">{doctorName}</p>
                          <p className="text-xs text-gray-500">
                            {appointment.doctor?.specialization ||
                              "General Practice"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatted.date}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatted.time}
                        </p>
                        <Badge
                          className={
                            appointment.status === "Scheduled"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {appointment.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
              {upcomingAppointments.length > 3 && (
                <div className="mt-4 text-center">
                  <Link to="/patient/appointments/upcoming">
                    <Button variant="outline">
                      View All Appointments ({upcomingAppointments.length})
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
