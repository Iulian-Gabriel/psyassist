// src/pages/ServicesList.tsx (FIXED VERSION for linting warnings)
import React, { useState, useEffect, useMemo, useCallback } from "react"; // Add useCallback
import { Link, useNavigate } from "react-router-dom";
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
  doctor: {
    employee: {
      user: {
        first_name: string;
        last_name: string;
      };
    };
  };
  serviceParticipants: Array<{
    patient: {
      user: {
        first_name: string;
        last_name: string;
      };
    };
  }>;
}

interface ServicesListProps {
  isDoctorView?: boolean;
}

export default function ServicesList({
  isDoctorView = false,
}: ServicesListProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        let endpoint = "/services";
        if (isDoctorView) {
          endpoint = "/doctor/current/services";
        }
        const response = await api.get(endpoint);
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
  }, [isDoctorView]); // Re-run effect if view mode changes

  // Wrap formatDateTime in useCallback
  const formatDateTime = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString();
  }, []); // Empty dependency array because it doesn't depend on any props/state

  // Wrap handleCancelService in useCallback
  const handleCancelService = useCallback(
    async (serviceId: number) => {
      if (!confirm("Are you sure you want to cancel this service?")) {
        return;
      }

      try {
        await api.patch(`/services/${serviceId}/cancel`, {
          cancel_reason: `Cancelled by ${isDoctorView ? "doctor" : "admin"}`,
        });
        // To update the state, we need 'services' and 'setServices'
        // These are stable if no other warnings/errors related to them,
        // but if you ever get one, you might add 'services' here and 'setServices' too.
        // For now, let's assume `setServices` is stable (which it usually is).
        setServices((prevServices) =>
          prevServices.map((service) =>
            service.service_id === serviceId
              ? { ...service, status: "Cancelled" }
              : service
          )
        );
      } catch (err) {
        console.error("Failed to cancel service:", err);
        setError("Failed to cancel service. Please try again.");
      }
    },
    [isDoctorView, setServices]
  ); // Depends on isDoctorView and setServices

  // Wrap handleEdit in useCallback
  const handleEdit = useCallback(
    (serviceId: number) => {
      if (isDoctorView) {
        navigate(`/doctor/services/${serviceId}/details`);
      } else {
        console.log("Admin edit service", serviceId);
        // navigate(`/admin/services/${serviceId}/edit`);
      }
    },
    [isDoctorView, navigate]
  ); // Depends on isDoctorView and navigate

  // Use useMemo to define columns, so they are not recreated on every render
  const columns: ColumnDef<Service>[] = useMemo(() => {
    const baseColumns: ColumnDef<Service>[] = [
      {
        accessorKey: "service_id",
        header: ({ column }) => <ColumnHeader column={column} title="ID" />,
      },
      {
        accessorKey: "service_type",
        header: ({ column }) => <ColumnHeader column={column} title="Type" />,
      },
    ];

    if (!isDoctorView) {
      baseColumns.push({
        id: "doctor_name",
        accessorFn: (row) =>
          `${row.doctor.employee.user.first_name} ${row.doctor.employee.user.last_name}`,
        header: ({ column }) => <ColumnHeader column={column} title="Doctor" />,
        cell: ({ row }) => (
          <div>
            {row.original.doctor.employee.user.first_name}{" "}
            {row.original.doctor.employee.user.last_name}
          </div>
        ),
      });
    } else {
      baseColumns.push({
        id: "patient_name",
        accessorFn: (row) =>
          row.serviceParticipants
            .map(
              (sp) =>
                `${sp.patient.user.first_name} ${sp.patient.user.last_name}`
            )
            .join(", "),
        header: ({ column }) => (
          <ColumnHeader column={column} title="Patient(s)" />
        ),
        cell: ({ row }) => (
          <div>
            {row.original.serviceParticipants
              .map(
                (sp) =>
                  `${sp.patient.user.first_name} ${sp.patient.user.last_name}`
              )
              .join(", ")}
          </div>
        ),
      });
    }

    baseColumns.push(
      {
        id: "start_time",
        accessorFn: (row) => row.start_time,
        header: ({ column }) => (
          <ColumnHeader column={column} title="Start Time" />
        ),
        cell: ({ row }) => formatDateTime(row.original.start_time),
      },
      {
        id: "end_time",
        accessorFn: (row) => row.end_time,
        header: ({ column }) => (
          <ColumnHeader column={column} title="End Time" />
        ),
        cell: ({ row }) => formatDateTime(row.original.end_time),
      },
      {
        accessorKey: "status",
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
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              variant="accent"
              size="sm"
              onClick={() => handleEdit(row.original.service_id)}
              title="Edit Service Details"
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
      }
    );

    return baseColumns;
  }, [isDoctorView, formatDateTime, handleEdit, handleCancelService]); // Dependencies for useMemo

  const searchableColumns = useMemo(() => {
    const columns = [
      { id: "service_type", title: "Type" },
      { id: "status", title: "Status" },
    ];

    if (!isDoctorView) {
      columns.push({ id: "doctor_name", title: "Doctor" });
    } else {
      columns.push({ id: "patient_name", title: "Patient" });
    }
    return columns;
  }, [isDoctorView]);

  const filterableColumns = useMemo(
    () => [
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
    ],
    [services]
  );

  const pageTitle = isDoctorView ? "My Services" : "Services Management";
  const backButtonLink = isDoctorView ? "/dashboard" : "/admin";
  const newServiceButton = !isDoctorView && (
    <Link to="/admin/services/new">
      <Button variant="default">New Service</Button>
    </Link>
  );

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
        <h1 className="text-3xl font-bold">{pageTitle}</h1>
        <div className="space-x-2">
          {newServiceButton}
          <Link to={backButtonLink}>
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{pageTitle}</CardTitle>
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
