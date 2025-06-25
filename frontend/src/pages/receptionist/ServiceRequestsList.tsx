import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import api from "@/services/api";
// import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";

// Icons
import {
  Calendar,
  Eye,
  FileText,
  MessageSquare,
  ThumbsDown,
  ThumbsUp,
  User,
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table/DataTable";
import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { ColumnHeader } from "@/components/ui/data-table/ColumnHeader";

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
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "urgent", desc: true }, // Sort urgent requests first
    { id: "created_at", desc: true }, // Then by creation date, most recent first
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  useEffect(() => {
    const fetchServiceRequests = async () => {
      try {
        setLoading(true);
        const response = await api.get("/service-requests");
        setServiceRequests(response.data);
      } catch (err) {
        console.error("Failed to fetch service requests:", err);
        setError("Failed to load service requests. Please try again.");
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
      const response = await api.patch(
        `/service-requests/${requestId}/approve`
      );

      // Update the local state with the updated request
      setServiceRequests((current) =>
        current.map((req) =>
          req.request_id === requestId ? { ...req, status: "approved" } : req
        )
      );

      // If the dialog is open, update the selected request as well
      if (selectedRequest?.request_id === requestId) {
        setSelectedRequest({ ...selectedRequest, status: "approved" });
      }
    } catch (err) {
      console.error("Failed to approve service request:", err);
      setError("Failed to approve the request. Please try again.");
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejection.");
      return;
    }

    try {
      const response = await api.patch(
        `/service-requests/${requestId}/reject`,
        {
          rejection_reason: rejectionReason,
        }
      );

      // Update the local state with the updated request
      setServiceRequests((current) =>
        current.map((req) =>
          req.request_id === requestId
            ? { ...req, status: "rejected", additional_notes: rejectionReason }
            : req
        )
      );

      // Reset dialog state
      setShowRejectDialog(false);
      setRejectionReason("");

      // If the details dialog is open, update the selected request
      if (selectedRequest?.request_id === requestId) {
        setSelectedRequest({
          ...selectedRequest,
          status: "rejected",
          additional_notes: rejectionReason,
        });
      }
    } catch (err) {
      console.error("Failed to reject service request:", err);
      setError("Failed to reject the request. Please try again.");
    }
  };

  const handleScheduleAppointment = (requestId: number) => {
    // Navigate to the appointment calendar with a query parameter
    navigate(`/receptionist/calendar?requestId=${requestId}`);
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
      id: "preferred_time",
      accessorKey: "preferred_time",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Preferred Time" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.original.preferred_time}</div>
      ),
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
        let badge;

        switch (status) {
          case "pending":
            badge = (
              <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
            );
            break;
          case "approved":
            badge = (
              <Badge className="bg-green-100 text-green-800">Approved</Badge>
            );
            break;
          case "rejected":
            badge = <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
            break;
          case "scheduled":
            badge = (
              <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
            );
            break;
          default:
            badge = <Badge>{status}</Badge>;
        }

        return badge;
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
            <Eye className="h-4 w-4" />
            View
          </Button>

          {row.original.status === "pending" && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-green-600"
                onClick={() => handleApproveRequest(row.original.request_id)}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600"
                onClick={() => {
                  setSelectedRequest(row.original);
                  setShowRejectDialog(true);
                }}
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </>
          )}

          {row.original.status === "approved" && (
            <Button
              variant="outline"
              size="sm"
              className="text-blue-600"
              onClick={() => handleScheduleAppointment(row.original.request_id)}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Schedule
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
      </div>

      {error && <ApiErrorDisplay error={error} className="mb-4" />}

      <Card>
        <CardHeader>
          <CardTitle>Patient Service Requests</CardTitle>
          <CardDescription>
            View and manage appointment requests from patients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading service requests...</div>
          ) : serviceRequests.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-lg text-muted-foreground">
                No service requests found
              </p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={serviceRequests}
              searchableColumns={searchableColumns}
              filterableColumns={filterableColumns}
              sorting={sorting}
              setSorting={setSorting}
              columnFilters={columnFilters}
              setColumnFilters={setColumnFilters}
            />
          )}
        </CardContent>
      </Card>

      {/* Request Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>Service Request Details</DialogTitle>
                <DialogDescription>
                  Request #{selectedRequest.request_id} submitted on{" "}
                  {format(new Date(selectedRequest.created_at), "PPp")}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient Information */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Patient Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div>
                      <span className="font-semibold">Name:</span>{" "}
                      {selectedRequest.patient.user.first_name}{" "}
                      {selectedRequest.patient.user.last_name}
                    </div>
                    <div>
                      <span className="font-semibold">Email:</span>{" "}
                      {selectedRequest.patient.user.email}
                    </div>
                    <div>
                      <span className="font-semibold">Phone:</span>{" "}
                      {selectedRequest.patient.user.phone_number}
                    </div>
                  </CardContent>
                </Card>

                {/* Request Details */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Request Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div>
                      <span className="font-semibold">Service Type:</span>{" "}
                      {selectedRequest.service_type.name}
                    </div>
                    <div>
                      <span className="font-semibold">Status:</span>{" "}
                      <Badge
                        className={`ml-1 ${
                          selectedRequest.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : selectedRequest.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : selectedRequest.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {selectedRequest.status.charAt(0).toUpperCase() +
                          selectedRequest.status.slice(1)}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-semibold">Urgency:</span>{" "}
                      {selectedRequest.urgent ? (
                        <Badge className="ml-1 bg-red-100 text-red-800">
                          Urgent
                        </Badge>
                      ) : (
                        <Badge className="ml-1" variant="outline">
                          Regular
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Preferred Dates & Time */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Preferred Dates & Time
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-semibold">First Choice:</span>{" "}
                      {format(
                        new Date(selectedRequest.preferred_date_1),
                        "PPPP"
                      )}
                    </div>
                    <div>
                      <span className="font-semibold">Preferred Time:</span>{" "}
                      <span className="capitalize">
                        {selectedRequest.preferred_time}
                      </span>
                    </div>

                    {selectedRequest.preferred_date_2 && (
                      <div>
                        <span className="font-semibold">Second Choice:</span>{" "}
                        {format(
                          new Date(selectedRequest.preferred_date_2),
                          "PPPP"
                        )}
                      </div>
                    )}

                    {selectedRequest.preferred_date_3 && (
                      <div>
                        <span className="font-semibold">Third Choice:</span>{" "}
                        {format(
                          new Date(selectedRequest.preferred_date_3),
                          "PPPP"
                        )}
                      </div>
                    )}

                    {selectedRequest.preferred_doctor && (
                      <div>
                        <span className="font-semibold">Preferred Doctor:</span>{" "}
                        {
                          selectedRequest.preferred_doctor.employee.user
                            .first_name
                        }{" "}
                        {
                          selectedRequest.preferred_doctor.employee.user
                            .last_name
                        }
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Reason & Notes */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Reason & Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-4">
                  <div>
                    <div className="font-semibold mb-1">
                      Reason for Request:
                    </div>
                    <div className="bg-muted p-3 rounded-md">
                      {selectedRequest.reason}
                    </div>
                  </div>

                  {selectedRequest.additional_notes && (
                    <div>
                      <div className="font-semibold mb-1">
                        Additional Notes:
                      </div>
                      <div className="bg-muted p-3 rounded-md">
                        {selectedRequest.additional_notes}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <DialogFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsDialog(false)}
                >
                  Close
                </Button>

                <div className="flex gap-2">
                  {selectedRequest.status === "pending" && (
                    <>
                      <Button
                        variant="outline"
                        className="text-green-600"
                        onClick={() =>
                          handleApproveRequest(selectedRequest.request_id)
                        }
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        className="text-red-600"
                        onClick={() => {
                          setShowDetailsDialog(false);
                          setShowRejectDialog(true);
                        }}
                      >
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}

                  {selectedRequest.status === "approved" && (
                    <Button
                      className="text-blue-600"
                      variant="outline"
                      onClick={() => {
                        setShowDetailsDialog(false);
                        handleScheduleAppointment(selectedRequest.request_id);
                      }}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Schedule Appointment
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Service Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this service request.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <label
              htmlFor="rejection_reason"
              className="text-sm font-medium mb-2 block"
            >
              Rejection Reason:
            </label>
            <Textarea
              id="rejection_reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter the reason for rejecting this request..."
              rows={4}
              className="w-full"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
                if (selectedRequest) {
                  setShowDetailsDialog(true);
                }
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedRequest) {
                  handleRejectRequest(selectedRequest.request_id);
                }
              }}
              disabled={!rejectionReason.trim()}
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
