import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import prisma from "../utils/prisma";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

// Define the Activity interface for type safety
interface Activity {
  type:
    | "appointment"
    | "completion"
    | "cancellation"
    | "request"
    | "user"
    | "test";
  message: string;
  time: string;
  timestamp: Date;
}

// Get comprehensive admin dashboard stats
export const getAdminDashboardStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const [
      totalUsers,
      totalDoctors,
      totalPatients,
      totalEmployees,
      activeServices,
      pendingRequests,
      completedTestsThisMonth,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Total doctors
      prisma.doctor.count({
        where: {
          employee: {
            user: {
              is_active: true,
            },
          },
        },
      }),

      // Total patients
      prisma.patient.count({
        where: {
          user: {
            is_active: true,
          },
        },
      }),

      // Total employees
      prisma.employee.count({
        where: {
          user: {
            is_active: true,
          },
        },
      }),

      // Active services (scheduled or in progress)
      prisma.service.count({
        where: {
          status: {
            in: ["Scheduled", "Active"],
          },
        },
      }),

      // Pending service requests
      prisma.serviceRequest.count({
        where: {
          status: "pending",
        },
      }),

      // Completed tests this month
      prisma.testInstance.count({
        where: {
          testStopDate: {
            not: null,
            gte: startOfMonth(new Date()),
            lte: endOfMonth(new Date()),
          },
        },
      }),
    ]);

    // Calculate system health based on various metrics
    const systemHealth = Math.round(
      85 + // Base health score
        (pendingRequests === 0 ? 10 : Math.max(0, 10 - pendingRequests)) + // Penalty for pending requests
        (activeServices > 0 ? 5 : 0) // Bonus for active services
    );

    res.json({
      totalUsers,
      totalDoctors,
      totalPatients,
      totalEmployees,
      activeServices,
      pendingRequests,
      completedTestsThisMonth,
      systemHealth: Math.min(100, systemHealth),
    });
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    res.status(500).json({ message: "Failed to fetch admin dashboard stats" });
  }
};

// Get user growth data for the last 4 weeks
export const getUserGrowthData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const growthData = [];

    for (let i = 3; i >= 0; i--) {
      const weekStart = subDays(new Date(), i * 7 + 7);
      const weekEnd = subDays(new Date(), i * 7);

      const newUsers = await prisma.user.count({
        where: {
          created_at: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
      });

      growthData.push({
        label: `Week ${4 - i}`,
        value: newUsers,
      });
    }

    res.json(growthData);
  } catch (error) {
    console.error("Error fetching user growth data:", error);
    res.status(500).json({ message: "Failed to fetch user growth data" });
  }
};

// Get system metrics
export const getSystemMetrics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Calculate real metrics based on your system data
    const [totalServices, completedServices, totalUsers, activeUsers] =
      await Promise.all([
        prisma.service.count(),
        prisma.service.count({ where: { status: "Completed" } }),
        prisma.user.count(),
        prisma.user.count({ where: { is_active: true } }),
      ]);

    const completionRate =
      totalServices > 0
        ? Math.round((completedServices / totalServices) * 100)
        : 0;
    const userActivityRate =
      totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

    const metrics = [
      { label: "User Activity", value: userActivityRate },
      { label: "Service Uptime", value: 98 }, // This could come from a monitoring service
      { label: "Data Integrity", value: 95 }, // This could come from database health checks
      { label: "Completion Rate", value: completionRate },
    ];

    res.json(metrics);
  } catch (error) {
    console.error("Error fetching system metrics:", error);
    res.status(500).json({ message: "Failed to fetch system metrics" });
  }
};

// Enhanced recent activity for admin
export const getRecentActivity = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit as string, 10) || 10;

    // Get recent activities from multiple sources
    const activities: Activity[] = [];

    // Recent user registrations
    const recentUsers = await prisma.user.findMany({
      take: Math.floor(limitNum / 4),
      orderBy: { created_at: "desc" },
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        created_at: true,
      },
    });

    recentUsers.forEach((user) => {
      activities.push({
        type: "user",
        message: `New user registered: ${user.first_name} ${user.last_name}`,
        time: format(new Date(user.created_at), "MMM d 'at' h:mm a"),
        timestamp: new Date(user.created_at),
      });
    });

    // Recent service requests
    const recentRequests = await prisma.serviceRequest.findMany({
      take: Math.floor(limitNum / 4),
      orderBy: { created_at: "desc" },
      include: {
        patient: {
          include: {
            user: {
              select: { first_name: true, last_name: true },
            },
          },
        },
      },
    });

    recentRequests.forEach((request) => {
      activities.push({
        type: "request",
        message: `New service request from ${request.patient.user.first_name} ${request.patient.user.last_name}`,
        time: format(new Date(request.created_at), "MMM d 'at' h:mm a"),
        timestamp: new Date(request.created_at),
      });
    });

    // Recent completed tests
    const recentTests = await prisma.testInstance.findMany({
      take: Math.floor(limitNum / 4),
      where: {
        testStopDate: {
          not: null,
        },
      },
      orderBy: { testStopDate: "desc" },
      include: {
        testTemplateVersion: {
          include: {
            testTemplate: {
              select: { name: true },
            },
          },
        },
        patient: {
          include: {
            user: {
              select: { first_name: true, last_name: true },
            },
          },
        },
      },
    });

    recentTests.forEach((test) => {
      // Add null checks for all potentially null properties
      if (
        test.testStopDate &&
        test.testTemplateVersion &&
        test.testTemplateVersion.testTemplate &&
        test.patient
      ) {
        activities.push({
          type: "test",
          message: `Test completed: ${test.testTemplateVersion.testTemplate.name} by ${test.patient.user.first_name} ${test.patient.user.last_name}`,
          time: format(new Date(test.testStopDate), "MMM d 'at' h:mm a"),
          timestamp: new Date(test.testStopDate),
        });
      }
    });

    // Recent appointments
    const recentAppointments = await prisma.service.findMany({
      take: Math.floor(limitNum / 4),
      orderBy: { start_time: "desc" },
      include: {
        serviceParticipants: {
          include: {
            patient: {
              include: {
                user: {
                  select: { first_name: true, last_name: true },
                },
              },
            },
          },
        },
      },
    });

    recentAppointments.forEach((service) => {
      const patient = service.serviceParticipants[0]?.patient;
      if (patient) {
        activities.push({
          type: "appointment",
          message: `${
            service.status === "Completed" ? "Completed" : "Scheduled"
          } appointment: ${service.service_type}`,
          time: format(new Date(service.start_time), "MMM d 'at' h:mm a"),
          timestamp: new Date(service.start_time),
        });
      }
    });

    // Sort by timestamp and limit
    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const limitedActivities = activities.slice(0, limitNum);

    res.json(limitedActivities);
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({ message: "Failed to fetch recent activity" });
  }
};

// Doctor's recent activity (existing function - keep as is)
export const getDoctorRecentActivity = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { limit = 10 } = req.query;

    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const doctor = await prisma.doctor.findFirst({
      where: { employee: { user_id: userId } },
    });

    if (!doctor) {
      res.status(404).json({ message: "Doctor not found" });
      return;
    }

    // Get recent activities from multiple sources
    const activities: any[] = [];

    // Recent appointments
    const recentServices = await prisma.service.findMany({
      where: { employee_id: doctor.doctor_id },
      take: 5,
      orderBy: { start_time: "desc" },
      include: {
        serviceParticipants: {
          include: {
            patient: {
              include: {
                user: {
                  select: {
                    first_name: true,
                    last_name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    recentServices.forEach((service) => {
      const patient = service.serviceParticipants[0]?.patient;
      if (patient) {
        activities.push({
          type: "appointment",
          message: `${
            service.status === "Completed" ? "Completed" : "Scheduled"
          } ${service.service_type} with ${patient.user.first_name} ${
            patient.user.last_name
          }`,
          time: getRelativeTime(new Date(service.start_time)),
        });
      }
    });

    // Recent test assignments
    const recentTests = await prisma.testInstance.findMany({
      where: {
        patient: {
          serviceParticipants: {
            some: {
              service: {
                employee_id: doctor.doctor_id,
              },
            },
          },
        },
      },
      take: 3,
      orderBy: { testStartDate: "desc" },
      include: {
        testTemplateVersion: {
          include: {
            testTemplate: {
              select: { name: true },
            },
          },
        },
        patient: {
          include: {
            user: {
              select: { first_name: true, last_name: true },
            },
          },
        },
      },
    });

    recentTests.forEach((test) => {
      // Add null checks for potentially null properties
      if (
        test.testTemplateVersion &&
        test.testTemplateVersion.testTemplate &&
        test.patient &&
        test.testStartDate // Add null check for testStartDate
      ) {
        activities.push({
          type: "test",
          message: `Test ${test.testStopDate ? "completed" : "assigned"}: ${
            test.testTemplateVersion.testTemplate.name
          } for ${test.patient.user.first_name} ${test.patient.user.last_name}`,
          time: getRelativeTime(new Date(test.testStartDate)), // Now safe to use
        });
      }
    });

    // Sort by most recent and limit
    const sortedActivities = activities
      .sort((a, b) => {
        // You might need to add timestamp field for proper sorting
        return 0; // For now, keep original order
      })
      .slice(0, parseInt(limit as string, 10) || 10);

    res.json(sortedActivities);
  } catch (error) {
    console.error("Error fetching doctor recent activity:", error);
    res.status(500).json({ message: "Failed to fetch recent activity" });
  }
};

// Helper function to get relative time
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor(
    (now.getTime() - new Date(date).getTime()) / 1000
  );

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
}
