import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import { Eye, FileText, PlusCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface Notice {
  notice_id: number;
  service_id: number;
  participant_id: number;
  issue_date: string;
  unique_notice_number: string | null;
  expiry_date: string | null;
  reason_for_issuance: string | null;
  fitness_status: string | null;
  recommendations: string | null;
  attachment_path: string | null;
  serviceParticipant: {
    patient: {
      user: {
        first_name: string;
        last_name: string;
      };
    };
  };
}

export default function NoticesList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get("/notices");
        setNotices(response.data);
      } catch (err) {
        console.error("Failed to fetch notices:", err);
        setError("Failed to load medical notices");
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, []);

  const handleViewNotice = (noticeId: number) => {
    navigate(`/doctor/notices/${noticeId}`);
  };

  const handleCreateNotice = () => {
    navigate("/doctor/notices/create");
  };

  const handleDeleteNotice = async (noticeId: number) => {
    if (window.confirm("Are you sure you want to delete this notice?")) {
      try {
        await api.delete(`/notices/${noticeId}`);
        // Update the list after deletion
        setNotices(notices.filter((notice) => notice.notice_id !== noticeId));
      } catch (err) {
        console.error("Failed to delete notice:", err);
        setError("Failed to delete notice");
      }
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Medical Notices</h1>
        <Button onClick={handleCreateNotice}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Notice
        </Button>
      </div>

      {error && <ApiErrorDisplay error={error} className="mb-6" />}

      <Card>
        <CardHeader>
          <CardTitle>Patient Medical Notices</CardTitle>
          <CardDescription>
            List of all medical notices issued to patients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-6">
              <p>Loading notices...</p>
            </div>
          ) : notices.length === 0 ? (
            <div className="text-center p-6">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">
                No medical notices found
              </p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={handleCreateNotice}
              >
                Create Your First Medical Notice
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Notice Number</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notices.map((notice) => (
                  <TableRow key={notice.notice_id}>
                    <TableCell>{notice.notice_id}</TableCell>
                    <TableCell>
                      {notice.serviceParticipant.patient.user.first_name}{" "}
                      {notice.serviceParticipant.patient.user.last_name}
                    </TableCell>
                    <TableCell>
                      {notice.unique_notice_number || "N/A"}
                    </TableCell>
                    <TableCell>{formatDate(notice.issue_date)}</TableCell>
                    <TableCell>{formatDate(notice.expiry_date)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          notice.expiry_date &&
                          new Date(notice.expiry_date) < new Date()
                            ? "destructive"
                            : "default"
                        }
                      >
                        {notice.expiry_date &&
                        new Date(notice.expiry_date) < new Date()
                          ? "Expired"
                          : "Valid"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewNotice(notice.notice_id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteNotice(notice.notice_id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
