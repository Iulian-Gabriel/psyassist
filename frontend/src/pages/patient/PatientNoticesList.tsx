import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import { ArrowLeft, Eye, FileText, Calendar, User } from "lucide-react";
import { format } from "date-fns";

interface PatientNotice {
  notice_id: number;
  unique_notice_number: string;
  issue_date: string;
  expiry_date: string | null;
  reason_for_issuance: string | null;
  fitness_status: string | null;
  recommendations: string | null;
  attachment_path: string | null;
  service: {
    service_id: number;
    service_type: string;
    start_time: string;
    doctor: {
      doctor_id: number;
      employee: {
        user: {
          first_name: string;
          last_name: string;
        };
      };
    };
  };
  // Add serviceParticipant with patient.user for consistency,
  // even if not directly displayed here, it might be in detailed view
  serviceParticipant: {
    participant_id: number;
    patient: {
      patient_id: number;
      user: {
        first_name: string;
        last_name: string;
      };
    };
  };
}

export default function PatientNoticesList() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState<PatientNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        const response = await api.get("/notices/patient/my-notices");
        setNotices(response.data);
      } catch (err: any) {
        console.error("Error fetching patient notices:", err);
        setError("Failed to load your notices. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, []);

  const handleViewNotice = (noticeId: number) => {
    navigate(`/patient/notices/${noticeId}`);
  };

  const getFitnessStatusColor = (status: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800";

    switch (status.toLowerCase()) {
      case "fit":
        return "bg-green-100 text-green-800";
      case "unfit":
        return "bg-red-100 text-red-800";
      case "restricted":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <p>Loading your notices...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <Link to="/patient">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">My Medical Notices</h1>
        <p className="text-muted-foreground mt-2">
          View notices and recommendations from your doctors
        </p>
      </div>

      {error && <ApiErrorDisplay error={error} className="mb-6" />}

      {notices.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Notices Found</h3>
            <p className="text-muted-foreground">
              You don't have any medical notices at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {notices.map((notice) => (
            <Card key={notice.notice_id} className="w-full">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Notice #{notice.unique_notice_number || notice.notice_id}
                      {isExpired(notice.expiry_date) && (
                        <Badge variant="destructive" className="ml-2">
                          Expired
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Issued on{" "}
                      {format(new Date(notice.issue_date), "MMMM d, yyyy")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Doctor Information */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm font-medium text-muted-foreground">
                      <User className="mr-2 h-4 w-4" />
                      Doctor
                    </div>
                    <p className="font-medium">
                      Dr. {notice.service.doctor.employee.user.first_name}{" "}
                      {notice.service.doctor.employee.user.last_name}
                    </p>
                  </div>

                  {/* Service Information */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm font-medium text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      Service Date
                    </div>
                    <p>
                      {format(
                        new Date(notice.service.start_time),
                        "MMM d, yyyy 'at' h:mm a"
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {notice.service.service_type}
                    </p>
                  </div>

                  {/* Fitness Status */}
                  {notice.fitness_status && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        Fitness Status
                      </div>
                      <Badge
                        className={getFitnessStatusColor(notice.fitness_status)}
                      >
                        {notice.fitness_status}
                      </Badge>
                    </div>
                  )}

                  {/* Expiry Date */}
                  {notice.expiry_date && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        Valid Until
                      </div>
                      <p
                        className={
                          isExpired(notice.expiry_date) ? "text-red-600" : ""
                        }
                      >
                        {format(new Date(notice.expiry_date), "MMMM d, yyyy")}
                      </p>
                    </div>
                  )}

                  {/* Reason */}
                  {notice.reason_for_issuance && (
                    <div className="space-y-2 md:col-span-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        Reason for Issuance
                      </div>
                      <p className="text-sm">{notice.reason_for_issuance}</p>
                    </div>
                  )}

                  {/* Recommendations Preview */}
                  {notice.recommendations && (
                    <div className="space-y-2 md:col-span-3">
                      <div className="text-sm font-medium text-muted-foreground">
                        Recommendations (Preview)
                      </div>
                      <p className="text-sm line-clamp-3">
                        {notice.recommendations.length > 100
                          ? `${notice.recommendations.substring(0, 100)}...`
                          : notice.recommendations}
                      </p>
                    </div>
                  )}
                </div>

                {notice.attachment_path && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      📎 This notice includes an attachment
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
