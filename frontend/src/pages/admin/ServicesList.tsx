import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { ColumnHeader } from "@/components/ui/data-table/ColumnHeader";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

interface Service {
  service_id: number;
  service_type: string;
  start_time: string;
  end_time: string;
  status: string;
  is_active: boolean; // Add this property
  doctor: {
    employee: {
      user: {
        first_name: string;
        last_name: string;
      };
    };
  };
}

export default function ServicesList() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await api.get("/services");
        setServices(response.data);
        setError(null);
      } catch (err: unknown) {
        console.error("Failed to fetch services:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : typeof err === "object" &&
              err !== null &&
              "response" in err &&
              err.response &&
              typeof err.response === "object" &&
              "data" in err.response &&
              err.response.data &&
              typeof err.response.data === "object" &&
              "message" in err.response.data &&
              typeof err.response.data.message === "string"
            ? err.response.data.message
            : "Failed to load services. Please try again later.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Format date for display
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleCancelService = async (serviceId: number) => {
    if (!confirm("Are you sure you want to cancel this service?")) {
      return;
    }

    try {
      await api.patch(`/services/${serviceId}/cancel`, {
        cancel_reason: "Cancelled by admin",
      });
      // Refresh the services list after cancellation
      setServices(
        services.map((service) =>
          service.service_id === serviceId
            ? { ...service, status: "Cancelled" }
            : service
        )
      );
    } catch (err) {
      console.error("Failed to cancel service:", err);
      setError("Failed to cancel service. Please try again.");
    }
  };

  const columns: ColumnDef<Service>[] = [
    {
      accessorKey: "service_id",
      header: ({ column }) => <ColumnHeader column={column} title="ID" />,
    },
    {
      accessorKey: "service_type",
      header: ({ column }) => <ColumnHeader column={column} title="Type" />,
    },
    {
      id: "doctor_name", // Simple ID
      accessorFn: (row) =>
        `${row.doctor.employee.user.first_name} ${row.doctor.employee.user.last_name}`, // Function for nested path
      header: ({ column }) => <ColumnHeader column={column} title="Doctor" />,
      cell: ({ row }) => (
        <div>
          {row.original.doctor.employee.user.first_name}{" "}
          {row.original.doctor.employee.user.last_name}
        </div>
      ),
    },
    {
      id: "start_time", // Simple ID
      accessorFn: (row) => row.start_time, // Direct access
      header: ({ column }) => (
        <ColumnHeader column={column} title="Start Time" />
      ),
      cell: ({ row }) => formatDateTime(row.original.start_time),
    },
    {
      id: "end_time", // Simple ID
      accessorFn: (row) => row.end_time, // Direct access
      header: ({ column }) => <ColumnHeader column={column} title="End Time" />,
      cell: ({ row }) => formatDateTime(row.original.end_time),
    },
    {
      accessorKey: "status", // Direct property
      header: ({ column }) => <ColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <Badge
          className={`${
            row.original.status === "Scheduled"
              ? "bg-blue-100 text-blue-800"
              : row.original.status === "Completed"
              ? "bg-green-100 text-green-800"
              : row.original.status === "Cancelled"
              ? "bg-red-100 text-red-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "is_active",
      accessorFn: (row) => row.is_active,
      header: ({ column }) => <ColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "default" : "destructive"}>
          {row.original.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="accent"
            size="sm"
            onClick={() => handleEdit(row.original.service_id)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleCancelService(row.original.service_id)}
            disabled={
              row.original.status === "Cancelled" ||
              row.original.status === "Completed"
            }
            title={
              row.original.status === "Scheduled"
                ? "Cancel Service"
                : `Service already ${row.original.status.toLowerCase()}`
            }
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Define filterable columns for dropdown filters
  const filterableColumns = [
    {
      id: "service_type",
      title: "Service Type",
      options: [
        ...Array.from(
          new Set(services.map((service) => service.service_type))
        ).map((type) => ({ value: type, label: type })),
      ],
    },
    {
      id: "status",
      title: "Status",
      options: [
        { value: "Scheduled", label: "Scheduled" },
        { value: "Completed", label: "Completed" },
        { value: "Cancelled", label: "Cancelled" },
      ],
    },
  ];

  // Define searchable columns for global search
  const searchableColumns = [
    { id: "doctor_name", title: "Doctor" },
    { id: "service_type", title: "Type" },
    { id: "status", title: "Status" },
  ];

  // const handleViewDetails = (serviceId: number) => {
  //   // Navigate to service details page
  //   console.log("View service", serviceId);
  // };

  const handleEdit = (serviceId: number) => {
    // Navigate to edit service page
    console.log("Edit service", serviceId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p>Loading services...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Services Management</h1>
        <div className="space-x-2">
          <Link to="/admin/services/new">
            <Button variant="default">New Service</Button>
          </Link>
          <Link to="/admin">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Services</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <ApiErrorDisplay error={error} />
          ) : (
            <DataTable
              columns={columns}
              data={services}
              searchableColumns={searchableColumns}
              filterableColumns={filterableColumns}
              pagination={true}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
