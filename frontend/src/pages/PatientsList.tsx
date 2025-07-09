// src/pages/PatientsList.tsx (UPDATED VERSION for Admin, Doctor, and Receptionist views)
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, RefreshCw, UserPlus, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";

import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { ColumnHeader } from "@/components/ui/data-table/ColumnHeader";

// Define the Patient interface to match your data structure
interface Patient {
  patient_id: number;
  user: {
    user_id: number;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    phone_number?: string;
  };
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

// Define props for the component
interface PatientsListProps {
  isDoctorView?: boolean;
  isReceptionistView?: boolean;
}

// Pass props into the functional component
export default function PatientsList({
  isDoctorView = false,
  isReceptionistView = false,
}: PatientsListProps) {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Initialize sorting state to show active patients first
  const [sorting, setSorting] = useState<SortingState>([
    { id: "status", desc: false }, // false means ascending - active first
  ]);
  const navigate = useNavigate();

  // Determine view type if not explicitly set
  const isAdminView = !isDoctorView && !isReceptionistView;

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        let endpoint = "/patients"; // Default for admin/receptionist view

        if (isDoctorView) {
          endpoint = "/doctor/current/patients"; // Doctor-specific endpoint
        }
        // Receptionist uses the same endpoint as admin for now

        const response = await api.get(endpoint);
        setPatients(response.data);
      } catch (err) {
        console.error("Failed to fetch patients:", err);
        setError("Failed to load patients. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [isDoctorView, isReceptionistView]);

  // Define searchable columns for multiple search
  const searchableColumns = [
    { id: "name", title: "Name" },
    { id: "email", title: "Email" },
    { id: "phone", title: "Phone" },
    { id: "emergency_contact_name", title: "Emergency Contact Name" },
    { id: "emergency_contact_phone", title: "Emergency Contact Phone" },
  ];

  // Define filterable columns
  const filterableColumns = [
    {
      id: "status",
      title: "Status",
      options: [
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" },
      ],
    },
  ];

  const handleDeactivate = async (patientId: number) => {
    if (!confirm("Are you sure you want to deactivate this patient?")) {
      return;
    }
    try {
      await api.patch(`/patients/${patientId}/deactivate`);
      setPatients(
        patients.map((patient) =>
          patient.patient_id === patientId
            ? { ...patient, user: { ...patient.user, is_active: false } }
            : patient
        )
      );
    } catch (err) {
      console.error("Failed to deactivate patient:", err);
      setError("Failed to deactivate patient. Please try again.");
    }
  };

  const handleReactivate = async (patientId: number) => {
    if (!confirm("Are you sure you want to reactivate this patient?")) {
      return;
    }
    try {
      await api.patch(`/patients/${patientId}/reactivate`);
      setPatients(
        patients.map((patient) =>
          patient.patient_id === patientId
            ? { ...patient, user: { ...patient.user, is_active: true } }
            : patient
        )
      );
    } catch (err) {
      console.error("Failed to reactivate patient:", err);
      setError("Failed to reactivate patient. Please try again.");
    }
  };

  const handleEdit = (patientId: number) => {
    // Conditional navigation based on view
    if (isDoctorView) {
      navigate(`/doctor/patients/${patientId}`);
    } else if (isReceptionistView) {
      navigate(`/receptionist/patients/${patientId}/view`); // Changed from /edit to /view
    } else {
      navigate(`/admin/patients/${patientId}/edit`); // Admin-specific edit
    }
  };

  const handleViewDetails = (patientId: number) => {
    if (isReceptionistView) {
      navigate(`/receptionist/patients/${patientId}/view`);
    } else if (isDoctorView) {
      navigate(`/doctor/patients/${patientId}/view-details`);
    } else {
      navigate(`/admin/patients/${patientId}/view`);
    }
  };

  // Define columns with proper type annotation
  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: "patient_id",
      header: ({ column }) => <ColumnHeader column={column} title="ID" />,
    },
    {
      id: "name",
      accessorFn: (row) => `${row.user.first_name} ${row.user.last_name}`,
      header: ({ column }) => <ColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <div>
          {row.original.user.first_name} {row.original.user.last_name}
        </div>
      ),
    },
    {
      id: "email",
      accessorFn: (row) => row.user.email,
      header: ({ column }) => <ColumnHeader column={column} title="Email" />,
    },
    {
      id: "phone",
      accessorFn: (row) => row.user.phone_number || "Not provided",
      header: ({ column }) => <ColumnHeader column={column} title="Phone" />,
    },
    {
      id: "emergency_contact_name",
      accessorFn: (row) => row.emergency_contact_name || "Not provided",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Emergency Contact" />
      ),
    },
    {
      id: "emergency_contact_phone",
      accessorFn: (row) => row.emergency_contact_phone || "Not provided",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Emergency Phone" />
      ),
    },
    {
      id: "status",
      accessorFn: (row) => (row.user.is_active ? "Active" : "Inactive"),
      header: ({ column }) => <ColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <Badge
          variant={row.original.user.is_active ? "default" : "destructive"}
        >
          {row.original.user.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
      filterFn: (row, id, filterValue) => {
        const status = row.original.user.is_active ? "Active" : "Inactive";
        return status === filterValue;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          {/* Admin View - Full permissions */}
          {isAdminView && (
            <>
              {row.original.user.is_active ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(row.original.patient_id)}
                  title="Edit Patient"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleReactivate(row.original.patient_id)}
                  title="Reactivate Patient"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeactivate(row.original.patient_id)}
                disabled={!row.original.user.is_active}
                title={
                  row.original.user.is_active
                    ? "Deactivate Patient"
                    : "Patient Already Inactive"
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Receptionist View - View and limited edit permissions */}
          {isReceptionistView && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewDetails(row.original.patient_id)}
                title="View Patient Details"
              >
                <Eye className="h-4 w-4" />
              </Button>
              {row.original.user.is_active && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(row.original.patient_id)}
                  title="Update Patient Info"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </>
          )}

          {/* Doctor View - View only */}
          {isDoctorView && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(row.original.patient_id)}
              title="View Patient Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Adjust title and button links based on view
  const getPageTitle = () => {
    if (isDoctorView) return "My Patients";
    if (isReceptionistView) return "Patient Records";
    return "Patients Management";
  };

  const getBackButtonLink = () => {
    if (isDoctorView) return "/doctor";
    if (isReceptionistView) return "/receptionist";
    return "/admin";
  };

  const pageTitle = getPageTitle();
  const backButtonLink = getBackButtonLink();

  // Only show "Add Patient" button for admin and receptionist views
  const showAddPatientButton = isAdminView || isReceptionistView;
  const addPatientRoute = isReceptionistView
    ? "/receptionist/patients/add"
    : "/admin/add-patient";

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{pageTitle}</h1>
        <div className="flex gap-2">
          {showAddPatientButton && (
            <Button onClick={() => navigate(addPatientRoute)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Patient
            </Button>
          )}
          <Link to={backButtonLink}>
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>

      {error && <ApiErrorDisplay error={error} className="mb-4" />}

      {loading ? (
        <div className="flex justify-center p-6">
          <p>Loading patients...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={patients}
          searchableColumns={searchableColumns}
          filterableColumns={filterableColumns}
          sorting={sorting}
          setSorting={setSorting}
          searchPlaceholder="Search patients..."
        />
      )}
    </div>
  );
}
