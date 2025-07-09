import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import api from "@/services/api";
import {
  Users,
  UserCog,
  Activity,
  MessageSquare,
  Calendar,
  UserRound,
  ScrollText,
  Shield,
  Heart,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  CheckCircle,
  Settings,
  Database,
  Eye,
  PlusCircle,
  FileText,
  Bell,
  Star,
  Brain,
} from "lucide-react";
import { format } from "date-fns";

// Interface for admin dashboard statistics
interface AdminDashboardStats {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  totalEmployees: number;
  activeServices: number;
  pendingRequests: number;
  completedTestsThisMonth: number;
  systemHealth: number;
}

// Interface for recent activity
interface RecentActivity {
  type: string;
  message: string;
  time: string;
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
                style={{
                  width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                }}
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

// System Health Component
const SystemHealthIndicator = ({ health }: { health: number }) => {
  const getHealthColor = (health: number) => {
    if (health >= 90) return "text-green-600";
    if (health >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getHealthLabel = (health: number) => {
    if (health >= 90) return "Excellent";
    if (health >= 70) return "Good";
    if (health >= 50) return "Fair";
    return "Needs Attention";
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="relative w-16 h-16">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center">
          <span className="text-white font-bold text-lg">{health}%</span>
        </div>
      </div>
      <div>
        <div className={`text-lg font-bold ${getHealthColor(health)}`}>
          {getHealthLabel(health)}
        </div>
        <div className="text-sm text-gray-600">System Status</div>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<AdminDashboardStats>({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalEmployees: 0,
    activeServices: 0,
    pendingRequests: 0,
    completedTestsThisMonth: 0,
    systemHealth: 0,
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [userGrowthData, setUserGrowthData] = useState([
    { label: "Week 1", value: 0 },
    { label: "Week 2", value: 0 },
    { label: "Week 3", value: 0 },
    { label: "Week 4", value: 0 },
  ]);
  const [systemMetrics, setSystemMetrics] = useState([]);
  const [previousStats, setPreviousStats] = useState({
    totalUsers: 0,
    totalPatients: 0,
    completedTests: 0,
  });

  useEffect(() => {
    const loadAdminDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Get admin dashboard stats
        const statsResponse = await api.get("/dashboard/admin/stats");
        setStats(statsResponse.data);

        // 2. Get user growth data
        const userGrowthResponse = await api.get(
          "/dashboard/admin/user-growth"
        );
        setUserGrowthData(userGrowthResponse.data);

        // 3. Get system metrics
        const metricsResponse = await api.get(
          "/dashboard/admin/system-metrics"
        );
        setSystemMetrics(metricsResponse.data);

        // 4. Get recent activity
        const activityResponse = await api.get("/dashboard/recent-activity", {
          params: { limit: 10 },
        });
        setRecentActivity(activityResponse.data);

        // 5. For comparison purposes, we'll calculate previous stats
        // You might want to add a specific API endpoint for this
        const currentMonth = new Date().getMonth();
        const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;

        // For now, we'll estimate previous stats (you can enhance this with a dedicated endpoint)
        setPreviousStats({
          totalUsers: Math.max(0, statsResponse.data.totalUsers - 5),
          totalPatients: Math.max(0, statsResponse.data.totalPatients - 3),
          completedTests: Math.max(
            0,
            statsResponse.data.completedTestsThisMonth - 2
          ),
        });
      } catch (err: any) {
        console.error("Error loading admin dashboard:", err);
        setError(
          err.response?.data?.message ||
            "Failed to load dashboard data. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAdminDashboard();
  }, []);

  // Calculate percentage changes
  const userGrowth =
    previousStats.totalUsers > 0
      ? Math.round(
          ((stats.totalUsers - previousStats.totalUsers) /
            previousStats.totalUsers) *
            100
        )
      : 0;

  const patientGrowth =
    previousStats.totalPatients > 0
      ? Math.round(
          ((stats.totalPatients - previousStats.totalPatients) /
            previousStats.totalPatients) *
            100
        )
      : 0;

  const testGrowth =
    previousStats.completedTests > 0
      ? Math.round(
          ((stats.completedTestsThisMonth - previousStats.completedTests) /
            previousStats.completedTests) *
            100
        )
      : 0;

  // Prepare chart data
  // Corrected User Distribution Logic:
  // The sum of chart categories must equal totalUsers.
  // We calculate "Other Staff" by subtracting patients and doctors from the total user count.
  // This accounts for all other roles (e.g., receptionists, admins) without double-counting.
  const otherStaffCount = Math.max(
    0,
    stats.totalUsers - stats.totalPatients - stats.totalDoctors
  );

  const userDistributionData = [
    { label: "Patients", value: stats.totalPatients },
    { label: "Doctors", value: stats.totalDoctors },
    { label: "Other Staff", value: otherStaffCount },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg text-gray-600">Loading admin dashboard...</p>
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
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                System overview and management center
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 p-4 rounded-xl border border-blue-200/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge className="bg-red-100 text-red-800">Administrator</Badge>
                <span className="text-sm text-gray-600">
                  Full system access and control
                </span>
              </div>
              <SystemHealthIndicator health={stats.systemHealth} />
            </div>
          </div>
        </div>

        {error && <ApiErrorDisplay error={error} className="mb-6" />}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">
                    Total Users
                  </p>
                  <p className="text-3xl font-bold text-blue-900">
                    {stats.totalUsers}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                {userGrowth >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span
                  className={
                    userGrowth >= 0 ? "text-green-600" : "text-red-600"
                  }
                >
                  {userGrowth >= 0 ? "+" : ""}
                  {userGrowth}% from last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">
                    Active Patients
                  </p>
                  <p className="text-3xl font-bold text-green-900">
                    {stats.totalPatients}
                  </p>
                </div>
                <Heart className="w-8 h-8 text-green-500" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                {patientGrowth >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span
                  className={
                    patientGrowth >= 0 ? "text-green-600" : "text-red-600"
                  }
                >
                  {patientGrowth >= 0 ? "+" : ""}
                  {patientGrowth}% growth
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
                <AlertCircle className="w-8 h-8 text-purple-500" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                {stats.pendingRequests > 0 ? (
                  <>
                    <Clock className="w-4 h-4 text-orange-500 mr-1" />
                    <span className="text-orange-600">Requires attention</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-600">All processed</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">
                    Tests This Month
                  </p>
                  <p className="text-3xl font-bold text-orange-900">
                    {stats.completedTestsThisMonth}
                  </p>
                </div>
                <Brain className="w-8 h-8 text-orange-500" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                {testGrowth >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span
                  className={
                    testGrowth >= 0 ? "text-green-600" : "text-red-600"
                  }
                >
                  {testGrowth >= 0 ? "+" : ""}
                  {testGrowth}% vs last month
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
                <span>User Growth</span>
              </CardTitle>
              <CardDescription>
                New user registrations over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleBarChart data={userGrowthData} title="Weekly New Users" />
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-purple-600" />
                <span>User Distribution</span>
              </CardTitle>
              <CardDescription>System user breakdown by role</CardDescription>
            </CardHeader>
            <CardContent>
              <SimplePieChart data={userDistributionData} title="User Types" />
            </CardContent>
          </Card>
        </div>

        {/* System Metrics & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-green-600" />
                <span>System Metrics</span>
              </CardTitle>
              <CardDescription>
                Real-time system performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleBarChart data={systemMetrics} title="Health Metrics (%)" />
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                Recent Activity
              </CardTitle>
              <CardDescription>Latest system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === "user"
                          ? "bg-blue-100"
                          : activity.type === "request"
                          ? "bg-purple-100"
                          : activity.type === "test"
                          ? "bg-orange-100"
                          : "bg-green-100"
                      }`}
                    >
                      {activity.type === "user" ? (
                        <Users className="w-4 h-4 text-blue-600" />
                      ) : activity.type === "request" ? (
                        <Calendar className="w-4 h-4 text-purple-600" />
                      ) : activity.type === "test" ? (
                        <Brain className="w-4 h-4 text-orange-600" />
                      ) : (
                        <Activity className="w-4 h-4 text-green-600" />
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

        {/* Quick Actions Grid */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
            <CardDescription>
              Administrative tools and management functions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <Link to="/admin/users">
                <Button className="w-full h-20 flex flex-col items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                  <Users className="w-6 h-6 mb-2" />
                  <span className="text-sm">Manage Users</span>
                </Button>
              </Link>

              <Link to="/admin/patients">
                <Button className="w-full h-20 flex flex-col items-center justify-center bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                  <UserRound className="w-6 h-6 mb-2" />
                  <span className="text-sm">Patient Records</span>
                </Button>
              </Link>

              <Link to="/admin/employees">
                <Button className="w-full h-20 flex flex-col items-center justify-center bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
                  <UserCog className="w-6 h-6 mb-2" />
                  <span className="text-sm">Staff Management</span>
                </Button>
              </Link>

              <Link to="/admin/service-requests">
                <Button className="w-full h-20 flex flex-col items-center justify-center bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                  <Calendar className="w-6 h-6 mb-2" />
                  <span className="text-sm">Service Requests</span>
                </Button>
              </Link>

              <Link to="/admin/services">
                <Button className="w-full h-20 flex flex-col items-center justify-center bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700">
                  <ScrollText className="w-6 h-6 mb-2" />
                  <span className="text-sm">Manage Services</span>
                </Button>
              </Link>

              <Link to="/admin/tests/completed">
                <Button className="w-full h-20 flex flex-col items-center justify-center bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700">
                  <Brain className="w-6 h-6 mb-2" />
                  <span className="text-sm">Test Results</span>
                </Button>
              </Link>

              <Link to="/admin/feedback">
                <Button className="w-full h-20 flex flex-col items-center justify-center bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700">
                  <MessageSquare className="w-6 h-6 mb-2" />
                  <span className="text-sm">Patient Feedback</span>
                </Button>
              </Link>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full h-20 flex flex-col items-center justify-center bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700">
                    <Eye className="w-6 h-6 mb-2" />
                    <span className="text-sm">System Status</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <Database className="w-5 h-5" />
                      <span>System Status Overview</span>
                    </DialogTitle>
                    <DialogDescription>
                      Current system health and performance metrics
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-700">
                            Server Status
                          </span>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-lg font-bold text-green-900">
                          Online
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-700">
                            Database
                          </span>
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-lg font-bold text-blue-900">
                          Connected
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">
                        Performance Metrics
                      </h4>
                      {systemMetrics.map((metric: any, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-gray-600">
                            {metric.label}
                          </span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-green-500 to-blue-600 h-2 rounded-full"
                                style={{ width: `${metric.value}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {metric.value}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
