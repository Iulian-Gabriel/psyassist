import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { ColumnHeader } from "@/components/ui/data-table/ColumnHeader";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import { Badge } from "@/components/ui/badge";
import { Check, X, Calendar } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { SortingState } from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { format } from "date-fns";

interface ServiceRequest {
  request_id: number;
  patient: {
    patient_id: number;
    user: {
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
    };
  };
  service_type: {
    name: string;
  };
  preferred_doctor?: {
    doctor_id: number;
    employee: {
      user: {
        first_name: string;
        last_name: string;
      };
    };
  };
  preferred_date_1: string;
  preferred_date_2: string | null;
  preferred_date_3: string | null;
  preferred_time: "morning" | "afternoon" | "evening";
  reason: string;
  urgent: boolean;
  additional_notes: string | null;
  status: "pending" | "approved" | "rejected" | "scheduled";
  created_at: string;
}

export default function ServiceRequestsList() {
  const navigate = useNavigate();
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(
    null
  );
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "urgent", desc: true }, // Sort urgent requests first
    { id: "created_at", desc: true }, // Then by creation date, most recent first
  ]);

  useEffect(() => {
    const fetchServiceRequests = async () => {
      try {
        setLoading(true);
        const response = await api.get("/service-requests");
        setServiceRequests(response.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch service requests:", err);
        setError("Failed to load service requests. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchServiceRequests();
  }, []);

  const handleViewDetails = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
  };

  const handleApproveRequest = async (requestId: number) => {
    try {
      await api.patch(`/service-requests/${requestId}/approve`);
      setServiceRequests(
        serviceRequests.map((request) =>
          request.request_id === requestId
            ? { ...request, status: "approved" }
            : request
        )
      );
      setShowDetailsDialog(false);
    } catch (err) {
      console.error("Failed to approve request:", err);
      setError("Failed to approve request. Please try again.");
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      await api.patch(`/service-requests/${requestId}/reject`);
      setServiceRequests(
        serviceRequests.map((request) =>
          request.request_id === requestId
            ? { ...request, status: "rejected" }
            : request
        )
      );
      setShowDetailsDialog(false);
    } catch (err) {
      console.error("Failed to reject request:", err);
      setError("Failed to reject request. Please try again.");
    }
  };

  const handleScheduleAppointment = (requestId: number) => {
    navigate(`/admin/appointments/schedule?requestId=${requestId}`);
  };

  const columns: ColumnDef<ServiceRequest>[] = [
    {
      accessorKey: "request_id",
      header: ({ column }) => <ColumnHeader column={column} title="ID" />,
    },
    {
      id: "patient_name",
      accessorFn: (row) =>
        `${row.patient.user.first_name} ${row.patient.user.last_name}`,
      header: ({ column }) => <ColumnHeader column={column} title="Patient" />,
      cell: ({ row }) => (
        <div>
          {row.original.patient.user.first_name}{" "}
          {row.original.patient.user.last_name}
        </div>
      ),
    },
    {
      accessorKey: "service_type.name",
      header: ({ column }) => <ColumnHeader column={column} title="Service" />,
    },
    {
      id: "preferred_date",
      accessorFn: (row) => row.preferred_date_1,
      header: ({ column }) => (
        <ColumnHeader column={column} title="Preferred Date" />
      ),
      cell: ({ row }) => format(new Date(row.original.preferred_date_1), "PPP"),
    },
    {
      id: "urgent",
      accessorFn: (row) => row.urgent,
      header: ({ column }) => <ColumnHeader column={column} title="Urgency" />,
      cell: ({ row }) => (
        <Badge
          variant={row.original.urgent ? "destructive" : "outline"}
          className={row.original.urgent ? "bg-red-100 text-red-800" : ""}
        >
          {row.original.urgent ? "Urgent" : "Regular"}
        </Badge>
      ),
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => <ColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant={
              status === "pending"
                ? "default"
                : status === "approved"
                ? "secondary"
                : status === "scheduled"
                ? "outline"
                : "destructive"
            }
            className={
              status === "pending"
                ? "bg-blue-100 text-blue-800"
                : status === "approved"
                ? "bg-green-100 text-green-800"
                : status === "scheduled"
                ? "bg-purple-100 text-purple-800"
                : "bg-red-100 text-red-800"
            }
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      id: "created_at",
      accessorFn: (row) => row.created_at,
      header: ({ column }) => (
        <ColumnHeader column={column} title="Requested On" />
      ),
      cell: ({ row }) => format(new Date(row.original.created_at), "PPp"),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDetails(row.original)}
          >
            View
          </Button>

          {row.original.status === "pending" && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleApproveRequest(row.original.request_id)}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRejectRequest(row.original.request_id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}

          {row.original.status === "approved" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleScheduleAppointment(row.original.request_id)}
            >
              <Calendar className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Define filterable columns
  const filterableColumns = [
    {
      id: "status",
      title: "Status",
      options: [
        { value: "pending", label: "Pending" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
        { value: "scheduled", label: "Scheduled" },
      ],
    },
    {
      id: "urgent",
      title: "Urgency",
      options: [
        { value: "true", label: "Urgent" },
        { value: "false", label: "Regular" },
      ],
    },
  ];

  // Define searchable columns
  const searchableColumns = [
    { id: "patient_name", title: "Patient Name" },
    { id: "service_type.name", title: "Service Type" },
  ];

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Service Requests</h1>
        <Link to="/admin">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      {error && <ApiErrorDisplay error={error} className="mb-4" />}

      <Card>
        <CardHeader>
          <CardTitle>Patient Service Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-6">
              <p>Loading service requests...</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={serviceRequests}
              searchableColumns={searchableColumns}
              filterableColumns={filterableColumns}
              initialSorting={sorting}
              searchPlaceholder="Search service requests..."
            />
          )}
        </CardContent>
      </Card>

      {/* Service Request Details Dialog */}
      {selectedRequest && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Service Request Details</DialogTitle>
              <DialogDescription>
                Request #{selectedRequest.request_id} from{" "}
                {selectedRequest.patient.user.first_name}{" "}
                {selectedRequest.patient.user.last_name}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="flex justify-between">
                <div>
                  <Badge
                    variant={selectedRequest.urgent ? "destructive" : "outline"}
                    className={
                      selectedRequest.urgent ? "bg-red-100 text-red-800" : ""
                    }
                  >
                    {selectedRequest.urgent ? "Urgent" : "Regular"}
                  </Badge>
                </div>
                <div>
                  <Badge
                    variant={
                      selectedRequest.status === "pending"
                        ? "default"
                        : selectedRequest.status === "approved"
                        ? "secondary"
                        : selectedRequest.status === "scheduled"
                        ? "outline"
                        : "destructive"
                    }
                    className={
                      selectedRequest.status === "pending"
                        ? "bg-blue-100 text-blue-800"
                        : selectedRequest.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : selectedRequest.status === "scheduled"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-red-100 text-red-800"
                    }
                  >
                    {selectedRequest.status.charAt(0).toUpperCase() +
                      selectedRequest.status.slice(1)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Service Type</h3>
                  <p>{selectedRequest.service_type.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Preferred Doctor</h3>
                  <p>
                    {selectedRequest.preferred_doctor
                      ? `${selectedRequest.preferred_doctor.employee.user.first_name} ${selectedRequest.preferred_doctor.employee.user.last_name}`
                      : "No preference"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium">Preferred Dates</h3>
                <ul className="list-disc list-inside">
                  <li>
                    {format(new Date(selectedRequest.preferred_date_1), "PPP")}{" "}
                    ({selectedRequest.preferred_time})
                  </li>
                  {selectedRequest.preferred_date_2 && (
                    <li>
                      {format(
                        new Date(selectedRequest.preferred_date_2),
                        "PPP"
                      )}{" "}
                      ({selectedRequest.preferred_time})
                    </li>
                  )}
                  {selectedRequest.preferred_date_3 && (
                    <li>
                      {format(
                        new Date(selectedRequest.preferred_date_3),
                        "PPP"
                      )}{" "}
                      ({selectedRequest.preferred_time})
                    </li>
                  )}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium">Reason for Visit</h3>
                <p>{selectedRequest.reason}</p>
              </div>

              {selectedRequest.additional_notes && (
                <div>
                  <h3 className="text-sm font-medium">Additional Notes</h3>
                  <p>{selectedRequest.additional_notes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Contact Information</h3>
                  <p>Email: {selectedRequest.patient.user.email}</p>
                  <p>Phone: {selectedRequest.patient.user.phone_number}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Request Received</h3>
                  <p>{format(new Date(selectedRequest.created_at), "PPpp")}</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDetailsDialog(false)}
              >
                Close
              </Button>
              {selectedRequest.status === "pending" && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() =>
                      handleRejectRequest(selectedRequest.request_id)
                    }
                  >
                    Reject Request
                  </Button>
                  <Button
                    variant="default"
                    onClick={() =>
                      handleApproveRequest(selectedRequest.request_id)
                    }
                  >
                    Approve Request
                  </Button>
                </>
              )}
              {selectedRequest.status === "approved" && (
                <Button
                  onClick={() =>
                    handleScheduleAppointment(selectedRequest.request_id)
                  }
                >
                  Schedule Appointment
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
