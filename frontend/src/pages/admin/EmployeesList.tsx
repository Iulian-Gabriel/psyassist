import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { ColumnHeader } from "@/components/ui/data-table/ColumnHeader";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import { Edit, Trash2, RefreshCw } from "lucide-react"; // Add Trash2 and RefreshCw icon imports
import { Badge } from "@/components/ui/badge";

interface Employee {
  employee_id: number;
  user: {
    user_id: number;
    email: string;
    first_name: string;
    last_name: string;
    userRoles: { role: { role_name: string } }[];
    is_active: boolean; // Add is_active field
  };
  job_title: string;
  hire_date: string;
  doctor?: {
    doctor_id: number;
    specialization: string | null;
  } | null;
}

export default function EmployeesList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await api.get("/employees");
        setEmployees(response.data);
        setError(null);
      } catch (err: unknown) {
        console.error("Failed to fetch employees:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : typeof err === "object" && err !== null && "response" in err
            ? (err as { response?: { data?: { message?: string } } }).response
                ?.data?.message || "Unknown error"
            : "Failed to load employees. Please try again later.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Function to display user roles
  const displayRoles = (userRoles: { role: { role_name: string } }[]) => {
    return userRoles.map((ur) => ur.role.role_name);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Add this function inside the component
  const handleDeactivate = async (employeeId: number) => {
    if (!confirm("Are you sure you want to deactivate this employee?")) {
      return;
    }

    try {
      await api.patch(`/employees/${employeeId}/deactivate`);
      // Refresh the employees list after deactivation
      setEmployees(
        employees.map((emp) =>
          emp.employee_id === employeeId
            ? { ...emp, user: { ...emp.user, is_active: false } }
            : emp
        )
      );
    } catch (err) {
      console.error("Failed to deactivate employee:", err);
      setError("Failed to deactivate employee. Please try again.");
    }
  };

  // Add this function below your handleDeactivate function
  const handleReactivate = async (employeeId: number) => {
    if (!confirm("Are you sure you want to reactivate this employee?")) {
      return;
    }

    try {
      await api.patch(`/employees/${employeeId}/reactivate`);
      // Refresh the employees list after reactivation
      setEmployees(
        employees.map((emp) =>
          emp.employee_id === employeeId
            ? { ...emp, user: { ...emp.user, is_active: true } }
            : emp
        )
      );
    } catch (err) {
      console.error("Failed to reactivate employee:", err);
      setError("Failed to reactivate employee. Please try again.");
    }
  };

  const columns = [
    {
      accessorKey: "employee_id",
      header: ({ column }) => <ColumnHeader column={column} title="ID" />,
    },
    {
      id: "name", // Simple ID
      accessorFn: (row) => `${row.user.first_name} ${row.user.last_name}`, // Function to access nested data
      header: ({ column }) => <ColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <div>
          {row.original.user.first_name} {row.original.user.last_name}
        </div>
      ),
    },
    {
      id: "email", // Simple ID
      accessorFn: (row) => row.user.email, // Function to access nested data
      header: ({ column }) => <ColumnHeader column={column} title="Email" />,
    },
    {
      accessorKey: "job_title",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Job Title" />
      ),
    },
    {
      id: "role", // Simple ID
      accessorFn: (row) => displayRoles(row.user.userRoles).join(", "), // Convert array to string for sorting/filtering
      header: ({ column }) => <ColumnHeader column={column} title="Role" />,
      cell: ({ row }) => (
        <div className="flex gap-1">
          {displayRoles(row.original.user.userRoles).map((role) => (
            <Badge key={role} variant="outline">
              {role}
            </Badge>
          ))}
        </div>
      ),
      // Custom filter function to check if the role includes the search text
      filterFn: (row, id, filterValue) => {
        const roles = displayRoles(row.original.user.userRoles);
        return roles.some((role) =>
          role.toLowerCase().includes(filterValue.toLowerCase())
        );
      },
    },
    {
      id: "hire_date", // Simple ID
      accessorFn: (row) => row.hire_date, // Direct access
      header: ({ column }) => (
        <ColumnHeader column={column} title="Hire Date" />
      ),
      cell: ({ row }) => formatDate(row.original.hire_date),
    },
    {
      id: "specialization", // Simple ID
      accessorFn: (row) => row.doctor?.specialization || "N/A", // Function with fallback
      header: ({ column }) => (
        <ColumnHeader column={column} title="Specialization" />
      ),
      cell: ({ row }) => row.original.doctor?.specialization || "N/A",
    },
    {
      id: "is_active",
      accessorFn: (row) => row.user.is_active, // Access is_active through the user object
      header: ({ column }) => <ColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <Badge
          variant={row.original.user.is_active ? "default" : "destructive"}
        >
          {row.original.user.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
      filterFn: (row, id, filterValue) => {
        const isActiveFilter = filterValue === "true";
        return row.original.user.is_active === isActiveFilter;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          {row.original.user.is_active ? (
            // Show Edit button if active
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(row.original.employee_id)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          ) : (
            // Show Reactivate button if inactive
            <Button
              variant="success"
              size="sm"
              onClick={() => handleReactivate(row.original.employee_id)}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDeactivate(row.original.employee_id)}
            disabled={!row.original.user.is_active}
            title={
              row.original.user.is_active
                ? "Deactivate Employee"
                : "Employee Already Inactive"
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
      id: "job_title",
      title: "Job Title",
      options: [
        ...Array.from(new Set(employees.map((emp) => emp.job_title))).map(
          (title) => ({ value: title, label: title })
        ),
      ],
    },
    {
      id: "is_active",
      title: "Status",
      options: [
        { value: "true", label: "Active" },
        { value: "false", label: "Inactive" },
      ],
    },
  ];

  // Define searchable columns for global search
  const searchableColumns = [
    { id: "name", title: "Name" },
    { id: "email", title: "Email" },
    { id: "job_title", title: "Job Title" },
    { id: "specialization", title: "Specialization" },
  ];

  const handleEdit = (employeeId: number) => {
    navigate(`/admin/employees/${employeeId}/edit`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p>Loading employees...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Employees Management</h1>
        <div className="space-x-2">
          <Link to="/admin/employees/new">
            <Button variant="default">Add Employee</Button>
          </Link>
          <Link to="/admin">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Employees</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <ApiErrorDisplay error={error} />
          ) : (
            <DataTable
              columns={columns}
              data={employees}
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
