import api from "./api";

export const receptionistService = {
  getCurrentReceptionist: async () => {
    try {
      const response = await api.get("/receptionists/current");
      return response.data;
    } catch (error: any) {
      // If it's a 404, the user might not be a receptionist
      if (error.response?.status === 404) {
        return { isReceptionist: false, message: "Not a receptionist" };
      }
      throw error;
    }
  },

  getServiceRequests: async (status?: string) => {
    const params = status ? { status } : {};
    const response = await api.get("/service-requests", { params });
    return response.data;
  },

  approveServiceRequest: async (requestId: number) => {
    const response = await api.patch(`/service-requests/${requestId}/approve`);
    return response.data;
  },

  rejectServiceRequest: async (requestId: number, reason: string) => {
    const response = await api.patch(`/service-requests/${requestId}/reject`, {
      rejection_reason: reason,
    });
    return response.data;
  },
};
