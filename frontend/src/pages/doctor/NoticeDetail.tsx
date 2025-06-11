import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ApiErrorDisplay from "@/components/ui/ApiErrorDisplay";
import { ArrowLeft, Download, Edit, FileText, Printer } from "lucide-react";
import { format } from "date-fns";
import { jsPDF } from "jspdf";

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
        date_of_birth: string;
        gender: string;
      };
    };
  };
  service: {
    doctor: {
      employee: {
        user: {
          first_name: string;
          last_name: string;
        };
      };
    };
  };
}

export default function NoticeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotice = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/notices/${id}`);
        setNotice(response.data);
      } catch (err) {
        console.error("Failed to fetch notice:", err);
        setError("Failed to load medical notice");
      } finally {
        setLoading(false);
      }
    };

    fetchNotice();
  }, [id]);

  const handleEdit = () => {
    if (id) {
      navigate(`/doctor/notices/edit/${id}`);
    }
  };

  const handleBack = () => {
    navigate("/doctor/notices");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMMM dd, yyyy");
  };

  const handleDownloadPdf = () => {
    if (!notice) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Add header
    pdf.setFontSize(18);
    pdf.text("PSYCHOLOGICAL NOTICE", pageWidth / 2, 15, { align: "center" });
    pdf.setFontSize(12);
    pdf.text(
      `Notice Number: ${notice.unique_notice_number || "Not Assigned"}`,
      pageWidth / 2,
      25,
      { align: "center" }
    );

    pdf.line(10, 30, pageWidth - 10, 30);

    // Patient information
    pdf.setFontSize(12);
    pdf.text("Patient Information:", 15, 40);
    pdf.setFontSize(10);
    pdf.text(
      `Name: ${notice.serviceParticipant.patient.user.first_name} ${notice.serviceParticipant.patient.user.last_name}`,
      20,
      50
    );
    pdf.text(
      `Date of Birth: ${formatDate(
        notice.serviceParticipant.patient.user.date_of_birth
      )}`,
      20,
      55
    );
    pdf.text(
      `Gender: ${notice.serviceParticipant.patient.user.gender}`,
      20,
      60
    );

    // Notice details
    pdf.setFontSize(12);
    pdf.text("Notice Details:", 15, 75);
    pdf.setFontSize(10);
    pdf.text(`Issue Date: ${formatDate(notice.issue_date)}`, 20, 85);
    pdf.text(`Expiry Date: ${formatDate(notice.expiry_date)}`, 20, 90);
    pdf.text(
      `Reason for Issuance: ${notice.reason_for_issuance || "Not specified"}`,
      20,
      95
    );
    pdf.text(
      `Fitness Status: ${notice.fitness_status || "Not specified"}`,
      20,
      100
    );

    // Recommendations
    if (notice.recommendations) {
      pdf.setFontSize(12);
      pdf.text("Recommendations:", 15, 115);
      pdf.setFontSize(10);

      // Split long text into multiple lines
      const splitRecommendations = pdf.splitTextToSize(
        notice.recommendations,
        pageWidth - 40
      );
      pdf.text(splitRecommendations, 20, 125);
    }

    // Doctor signature
    const signatureY = notice.recommendations ? 165 : 135;
    pdf.setFontSize(12);
    pdf.text("Issued by:", 15, signatureY);
    pdf.setFontSize(10);

    if (notice.service?.doctor?.employee?.user) {
      pdf.text(
        `Dr. ${notice.service.doctor.employee.user.first_name} ${notice.service.doctor.employee.user.last_name}`,
        20,
        signatureY + 10
      );
    } else {
      pdf.text("Created by Admin", 20, signatureY + 10);
    }

    pdf.text(`Date: ${formatDate(notice.issue_date)}`, 20, signatureY + 15);

    // Add signature line
    pdf.line(20, signatureY + 30, 100, signatureY + 30);
    pdf.text("Signature", 50, signatureY + 35);

    // Download PDF
    pdf.save(
      `psychological_notice_${
        notice.unique_notice_number || notice.notice_id
      }.pdf`
    );
  };

  const handlePrintPdf = () => {
    if (!notice) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Add header
    pdf.setFontSize(18);
    pdf.text("PSYCHOLOGICAL NOTICE", pageWidth / 2, 15, { align: "center" });
    pdf.setFontSize(12);
    pdf.text(
      `Notice Number: ${notice.unique_notice_number || "Not Assigned"}`,
      pageWidth / 2,
      25,
      { align: "center" }
    );

    pdf.line(10, 30, pageWidth - 10, 30);

    // Patient information
    pdf.setFontSize(12);
    pdf.text("Patient Information:", 15, 40);
    pdf.setFontSize(10);
    pdf.text(
      `Name: ${notice.serviceParticipant.patient.user.first_name} ${notice.serviceParticipant.patient.user.last_name}`,
      20,
      50
    );
    pdf.text(
      `Date of Birth: ${formatDate(
        notice.serviceParticipant.patient.user.date_of_birth
      )}`,
      20,
      55
    );
    pdf.text(
      `Gender: ${notice.serviceParticipant.patient.user.gender}`,
      20,
      60
    );

    // Notice details
    pdf.setFontSize(12);
    pdf.text("Notice Details:", 15, 75);
    pdf.setFontSize(10);
    pdf.text(`Issue Date: ${formatDate(notice.issue_date)}`, 20, 85);
    pdf.text(`Expiry Date: ${formatDate(notice.expiry_date)}`, 20, 90);
    pdf.text(
      `Reason for Issuance: ${notice.reason_for_issuance || "Not specified"}`,
      20,
      95
    );
    pdf.text(
      `Fitness Status: ${notice.fitness_status || "Not specified"}`,
      20,
      100
    );

    // Recommendations
    if (notice.recommendations) {
      pdf.setFontSize(12);
      pdf.text("Recommendations:", 15, 115);
      pdf.setFontSize(10);

      // Split long text into multiple lines
      const splitRecommendations = pdf.splitTextToSize(
        notice.recommendations,
        pageWidth - 40
      );
      pdf.text(splitRecommendations, 20, 125);
    }

    // Doctor signature
    const signatureY = notice.recommendations ? 165 : 135;
    pdf.setFontSize(12);
    pdf.text("Issued by:", 15, signatureY);
    pdf.setFontSize(10);

    if (notice.service?.doctor?.employee?.user) {
      pdf.text(
        `Dr. ${notice.service.doctor.employee.user.first_name} ${notice.service.doctor.employee.user.last_name}`,
        20,
        signatureY + 10
      );
    } else {
      pdf.text("Created by Admin", 20, signatureY + 10);
    }

    pdf.text(`Date: ${formatDate(notice.issue_date)}`, 20, signatureY + 15);

    // Add signature line
    pdf.line(20, signatureY + 30, 100, signatureY + 30);
    pdf.text("Signature", 50, signatureY + 35);

    // Print PDF
    pdf.autoPrint();
    window.open(pdf.output("bloburl"), "_blank");
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <p>Loading notice details...</p>
      </div>
    );
  }

  if (error || !notice) {
    return (
      <div className="container mx-auto p-4">
        <ApiErrorDisplay error={error || "Notice not found"} />
        <Button className="mt-4" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Notices
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Medical Notice Details</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Notices
          </Button>
          <Button onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Notice
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex justify-between">
            <span>
              Notice #{notice.unique_notice_number || notice.notice_id}
            </span>
            <div className="text-sm text-muted-foreground">
              {notice.expiry_date &&
              new Date(notice.expiry_date) < new Date() ? (
                <span className="text-red-500">Expired</span>
              ) : (
                <span className="text-green-500">Valid</span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Patient Information</h3>
                <p className="text-sm text-muted-foreground">
                  <strong>Name:</strong>{" "}
                  {notice.serviceParticipant.patient.user.first_name}{" "}
                  {notice.serviceParticipant.patient.user.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Date of Birth:</strong>{" "}
                  {formatDate(
                    notice.serviceParticipant.patient.user.date_of_birth
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Gender:</strong>{" "}
                  {notice.serviceParticipant.patient.user.gender}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Notice Details</h3>
                <p className="text-sm text-muted-foreground">
                  <strong>Issue Date:</strong> {formatDate(notice.issue_date)}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Expiry Date:</strong> {formatDate(notice.expiry_date)}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Reason for Issuance</h3>
                <p className="text-sm">
                  {notice.reason_for_issuance || "Not specified"}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Fitness Status</h3>
                <p className="text-sm">
                  {notice.fitness_status || "Not specified"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Recommendations</h3>
            <p className="text-sm whitespace-pre-wrap">
              {notice.recommendations || "No recommendations provided."}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Issued By</h3>
            {notice.service?.doctor?.employee?.user ? (
              <p className="text-sm">
                Dr. {notice.service.doctor.employee.user.first_name}{" "}
                {notice.service.doctor.employee.user.last_name}
              </p>
            ) : (
              <p className="text-sm">Created by Admin</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={handlePrintPdf}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleDownloadPdf}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
