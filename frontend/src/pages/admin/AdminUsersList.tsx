import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { ColumnHeader } from "@/components/ui/data-table/ColumnHeader";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import { Edit, Trash2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import { SortingState } from "@tanstack/react-table";

interface User {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  userRoles: { role: { role_name: string } }[];
  is_active: boolean;
}

export default function AdminUsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "status", desc: false }, // 'false' means ascending - active first, inactive last
  ]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await api.get("/users");
        setUsers(response.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setError("Failed to load users. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Function to display user roles
  const displayRoles = (userRoles: { role: { role_name: string } }[]) => {
    return userRoles.map((ur) => ur.role.role_name);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // // Handle button actions
  // const handleView = (userId: number) => {
  //   navigate(`/admin/users/${userId}`);
  // };

  const handleEdit = (userId: number) => {
    navigate(`/admin/users/${userId}/edit`);
  };

  const handleDeactivate = async (userId: number) => {
    if (!confirm("Are you sure you want to deactivate this user?")) {
      return;
    }

    try {
      await api.patch(`/users/${userId}/deactivate`);
      // Refresh the users list after deactivation
      setUsers(
        users.map((user) =>
          user.user_id === userId ? { ...user, is_active: false } : user
        )
      );
    } catch (err) {
      console.error("Failed to deactivate user:", err);
      // Show error message
      setError("Failed to deactivate user. Please try again.");
    }
  };

  // Add reactivate function
  const handleReactivate = async (userId: number) => {
    if (!confirm("Are you sure you want to reactivate this user?")) {
      return;
    }

    try {
      await api.patch(`/users/${userId}/reactivate`);
      // Update the users list after reactivation
      setUsers(
        users.map((user) =>
          user.user_id === userId ? { ...user, is_active: true } : user
        )
      );
    } catch (err) {
      console.error("Failed to reactivate user:", err);
      setError("Failed to reactivate user. Please try again.");
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "user_id",
      header: ({ column }) => <ColumnHeader column={column} title="ID" />,
    },
    {
      id: "name", // Simple ID
      accessorFn: (row) => `${row.first_name} ${row.last_name}`, // Combine first and last name
      header: ({ column }) => <ColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <div>
          {row.original.first_name} {row.original.last_name}
        </div>
      ),
    },
    {
      accessorKey: "email", // This is already a direct property, so accessorKey works
      header: ({ column }) => <ColumnHeader column={column} title="Email" />,
    },
    {
      id: "roles", // Simple ID
      accessorFn: (row) => displayRoles(row.userRoles).join(", "), // Join roles for filtering/sorting
      header: ({ column }) => <ColumnHeader column={column} title="Roles" />,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {displayRoles(row.original.userRoles).map((role) => (
            <Badge key={role} variant="outline">
              {role}
            </Badge>
          ))}
        </div>
      ),
      filterFn: (row, id, filterValue) => {
        const roles = displayRoles(row.original.userRoles);
        return roles.some((role) =>
          role.toLowerCase().includes(filterValue.toLowerCase())
        );
      },
    },
    {
      id: "created_at", // Simple ID
      accessorFn: (row) => row.created_at, // Direct access
      header: ({ column }) => <ColumnHeader column={column} title="Created" />,
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
      id: "status",
      accessorFn: (row) => (row.is_active ? "Active" : "Inactive"),
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
          {row.original.is_active ? (
            // Show Edit button if active
            <Button
              variant="accent"
              size="sm"
              onClick={() => handleEdit(row.original.user_id)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          ) : (
            // Show Reactivate button if inactive
            <Button
              variant="success" // You might need to add this variant to your button.tsx
              size="sm"
              onClick={() => handleReactivate(row.original.user_id)}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDeactivate(row.original.user_id)}
            disabled={!row.original.is_active}
            title={
              row.original.is_active
                ? "Deactivate User"
                : "User Already Inactive"
            }
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Define filterable columns
  const filterableColumns = [
    {
      id: "status", // CHANGE THIS to match the column ID
      title: "Status",
      options: [
        { value: "Active", label: "Active" }, // CHANGE THESE values to match what your accessorFn returns
        { value: "Inactive", label: "Inactive" },
      ],
    },
  ];

  // Define searchable columns for global search
  const searchableColumns = [
    { id: "name", title: "Name" },
    { id: "email", title: "Email" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Users Management</h1>
        <Link to="/admin">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <ApiErrorDisplay error={error} />
          ) : (
            <DataTable
              columns={columns}
              data={users}
              searchableColumns={searchableColumns} // Pass searchable columns
              filterableColumns={filterableColumns}
              pagination={true}
              sorting={sorting}
              setSorting={setSorting}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
