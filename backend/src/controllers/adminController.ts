import { Request, Response } from "express";
import prisma from "../utils/prisma";

// adminController.ts
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [totalUsers, totalDoctors, totalPatients, recentAppointments] =
      await Promise.all([
        prisma.user.count(),
        prisma.doctor.count(),
        prisma.patient.count(),
        prisma.service.findMany({
          take: 5,
          orderBy: { start_time: "desc" },
          include: {
            doctor: {
              include: {
                employee: {
                  include: {
                    user: true,
                  },
                },
              },
            },
            serviceParticipants: {
              include: {
                patient: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        }),
      ]);

    res.json({
      stats: {
        totalUsers,
        totalDoctors,
        totalPatients,
      },
      recentAppointments,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ message: "Failed to fetch admin dashboard data" });
  }
};
