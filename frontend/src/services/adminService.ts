import api from "./api";

interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  status: string;
  // Add other appointment properties as needed
}

interface AdminStats {
  stats: {
    totalUsers: number;
    totalDoctors: number;
    totalPatients: number;
  };
  recentAppointments: Appointment[];
}

export const fetchAdminStats = async (): Promise<AdminStats> => {
  try {
    const response = await api.get("/admin/stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    throw error;
  }
};
