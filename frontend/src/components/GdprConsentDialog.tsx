import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileDown, Printer } from "lucide-react";
import jsPDF from "jspdf";

interface PatientData {
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender?: string;
  phone_number: string;
  address_street?: string;
  address_city?: string;
  address_postal_code?: string;
  address_country?: string;
  address_county?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

interface GdprConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  patientData: PatientData | null;
}

export function GdprConsentDialog({
  open,
  onOpenChange,
  onConfirm,
  patientData,
}: GdprConsentDialogProps) {
  const [consentChecked, setConsentChecked] = useState(false);

  const generateGdprPdf = (): jsPDF => {
    // Create new PDF document
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    // Helper function to add wrapped text
    const addWrappedText = (
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      lineHeight: number = 7
    ): number => {
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return y + lines.length * lineHeight;
    };

    // Add header
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text("GDPR DATA PROCESSING CONSENT FORM", pageWidth / 2, 20, {
      align: "center",
    });

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text("PsyAssist - Patient Data Protection", pageWidth / 2, 30, {
      align: "center",
    });
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, 35, {
      align: "center",
    });

    // Add separator line
    pdf.setDrawColor(0, 0, 0);
    pdf.line(margin, 40, pageWidth - margin, 40);

    // Patient information section
    let yPosition = 50;
    if (patientData) {
      pdf.setFont("helvetica", "bold");
      pdf.text("PATIENT INFORMATION", margin, yPosition);
      yPosition += 10;

      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Name: ${patientData.first_name} ${patientData.last_name}`,
        margin,
        yPosition
      );
      yPosition += 7;

      pdf.text(`Email: ${patientData.email}`, margin, yPosition);
      yPosition += 7;

      pdf.text(
        `Date of Birth: ${new Date(
          patientData.date_of_birth
        ).toLocaleDateString()}`,
        margin,
        yPosition
      );
      yPosition += 7;

      pdf.text(`Phone: ${patientData.phone_number}`, margin, yPosition);
      yPosition += 7;

      // Add address if available
      if (patientData.address_street || patientData.address_city) {
        let address = "";
        if (patientData.address_street) address += patientData.address_street;
        if (patientData.address_city) {
          if (address) address += ", ";
          address += patientData.address_city;
        }
        if (patientData.address_postal_code) {
          if (address) address += ", ";
          address += patientData.address_postal_code;
        }
        if (patientData.address_county) {
          if (address) address += ", ";
          address += patientData.address_county;
        }
        if (patientData.address_country) {
          if (address) address += ", ";
          address += patientData.address_country;
        }
        pdf.text(`Address: ${address}`, margin, yPosition);
        yPosition += 7;
      }

      // Add emergency contact if available
      if (
        patientData.emergency_contact_name &&
        patientData.emergency_contact_phone
      ) {
        pdf.text(
          `Emergency Contact: ${patientData.emergency_contact_name} (${patientData.emergency_contact_phone})`,
          margin,
          yPosition
        );
        yPosition += 7;
      }

      yPosition += 5;
    }

    // Introduction
    pdf.setFont("helvetica", "bold");
    pdf.text("1. INTRODUCTION", margin, yPosition);
    yPosition += 10;

    pdf.setFont("helvetica", "normal");
    yPosition = addWrappedText(
      "This document explains how PsyAssist collects, uses, and protects your personal data in accordance with the General Data Protection Regulation (GDPR). By signing this form, you give your explicit consent for the processing of your personal data as outlined below.",
      margin,
      yPosition,
      contentWidth
    );
    yPosition += 10;

    // Data Controller
    pdf.setFont("helvetica", "bold");
    pdf.text("2. DATA CONTROLLER", margin, yPosition);
    yPosition += 10;

    pdf.setFont("helvetica", "normal");
    yPosition = addWrappedText(
      "PsyAssist is the data controller responsible for your personal data. You can contact us regarding your data at contact@psyassist.com.",
      margin,
      yPosition,
      contentWidth
    );
    yPosition += 10;

    // Types of Data
    pdf.setFont("helvetica", "bold");
    pdf.text("3. TYPES OF PERSONAL DATA WE PROCESS", margin, yPosition);
    yPosition += 10;

    pdf.setFont("helvetica", "normal");
    yPosition = addWrappedText(
      "We collect and process the following categories of personal data:",
      margin,
      yPosition,
      contentWidth
    );
    yPosition += 7;

    const dataTypes = [
      "• Personal identification information (name, date of birth, contact details)",
      "• Special category data relating to your health",
      "• Treatment history and medical records",
      "• Appointment details and session notes",
      "• Billing and payment information",
    ];

    dataTypes.forEach((item) => {
      pdf.text(item, margin + 5, yPosition);
      yPosition += 7;
    });
    yPosition += 5;

    // Purpose of Processing
    pdf.setFont("helvetica", "bold");
    pdf.text("4. PURPOSE OF PROCESSING", margin, yPosition);
    yPosition += 10;

    pdf.setFont("helvetica", "normal");
    yPosition = addWrappedText(
      "Your personal data is processed for the following purposes:",
      margin,
      yPosition,
      contentWidth
    );
    yPosition += 7;

    const purposes = [
      "• Providing healthcare services and treatment",
      "• Managing your appointments and healthcare records",
      "• Contacting you regarding your treatment",
      "• Processing payments and maintaining accounts",
      "• Complying with legal and regulatory obligations",
    ];

    purposes.forEach((item) => {
      pdf.text(item, margin + 5, yPosition);
      yPosition += 7;
    });
    yPosition += 5;

    // Check if we need to add a new page for the remaining content
    if (yPosition > pdf.internal.pageSize.getHeight() - 50) {
      pdf.addPage();
      yPosition = 20;
    }

    // Legal Basis
    pdf.setFont("helvetica", "bold");
    pdf.text("5. LEGAL BASIS FOR PROCESSING", margin, yPosition);
    yPosition += 10;

    pdf.setFont("helvetica", "normal");
    yPosition = addWrappedText(
      "We process your personal data based on the following legal grounds:",
      margin,
      yPosition,
      contentWidth
    );
    yPosition += 7;

    const legalBases = [
      "• Your explicit consent (which you can withdraw at any time)",
      "• Necessary for the performance of a contract",
      "• Compliance with legal obligations",
      "• Protection of vital interests in emergency situations",
    ];

    legalBases.forEach((item) => {
      pdf.text(item, margin + 5, yPosition);
      yPosition += 7;
    });
    yPosition += 5;

    // Data Retention
    pdf.setFont("helvetica", "bold");
    pdf.text("6. DATA RETENTION", margin, yPosition);
    yPosition += 10;

    pdf.setFont("helvetica", "normal");
    yPosition = addWrappedText(
      "We will retain your personal data for as long as necessary to fulfill the purposes we collected it for, including legal, accounting, or reporting requirements. Medical records are typically kept for a minimum period required by law.",
      margin,
      yPosition,
      contentWidth
    );
    yPosition += 10;

    // Rights
    pdf.setFont("helvetica", "bold");
    pdf.text("7. YOUR RIGHTS UNDER GDPR", margin, yPosition);
    yPosition += 10;

    pdf.setFont("helvetica", "normal");
    yPosition = addWrappedText(
      "Under the GDPR, you have the following rights:",
      margin,
      yPosition,
      contentWidth
    );
    yPosition += 7;

    const rights = [
      "• Right to access your personal data",
      "• Right to rectification of inaccurate data",
      "• Right to erasure ('right to be forgotten')",
      "• Right to restrict processing",
      "• Right to data portability",
      "• Right to object to processing",
      "• Right to withdraw consent at any time",
    ];

    rights.forEach((item) => {
      pdf.text(item, margin + 5, yPosition);
      yPosition += 7;
    });

    // Check if we need to add a new page for the signature section
    if (yPosition > pdf.internal.pageSize.getHeight() - 70) {
      pdf.addPage();
      yPosition = 20;
    } else {
      yPosition += 10;
    }

    // Consent declaration
    pdf.setFont("helvetica", "bold");
    pdf.text("CONSENT DECLARATION", margin, yPosition);
    yPosition += 10;

    pdf.setFont("helvetica", "normal");
    if (patientData) {
      yPosition = addWrappedText(
        `I, ${patientData.first_name} ${patientData.last_name}, hereby give my explicit consent for PsyAssist to collect, process, and store my personal data as described in this document. I understand that I can withdraw my consent at any time.`,
        margin,
        yPosition,
        contentWidth
      );
    } else {
      yPosition = addWrappedText(
        "I hereby give my explicit consent for PsyAssist to collect, process, and store my personal data as described in this document. I understand that I can withdraw my consent at any time.",
        margin,
        yPosition,
        contentWidth
      );
    }
    yPosition += 15;

    // Signature lines
    pdf.text(
      "Patient Signature: _________________________________",
      margin,
      yPosition
    );
    yPosition += 15;

    pdf.text("Date: _________________________________", margin, yPosition);
    yPosition += 15;

    pdf.text(
      "Healthcare Provider Signature: _________________________________",
      margin,
      yPosition
    );
    yPosition += 15;

    pdf.text("Date: _________________________________", margin, yPosition);

    return pdf;
  };

  const handleDownloadPdf = () => {
    const pdf = generateGdprPdf();
    pdf.save("GDPR-Consent-Form.pdf");
  };

  const handlePrintPdf = () => {
    const pdf = generateGdprPdf();
    const pdfBlob = pdf.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    const printWindow = window.open(pdfUrl);
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
        URL.revokeObjectURL(pdfUrl);
      };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>GDPR Consent Required</DialogTitle>
          <DialogDescription>
            Before creating a patient account, you must ensure the patient has
            given their consent for data processing according to GDPR
            regulations.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <p>
            You are required to download and print the GDPR consent form, have
            it signed by the patient, and keep it on file. The form includes the
            patient's personal information and explains how their data will be
            processed.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadPdf}
              className="flex items-center gap-2"
            >
              <FileDown className="h-4 w-4" />
              Download Form
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handlePrintPdf}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Form
            </Button>
          </div>
          <div className="flex items-center space-x-2 pt-4">
            <Checkbox
              id="gdpr-consent"
              checked={consentChecked}
              onCheckedChange={(checked) =>
                setConsentChecked(checked as boolean)
              }
            />
            <label
              htmlFor="gdpr-consent"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
            >
              I confirm that I have downloaded the GDPR consent form and
              obtained the patient's written consent
            </label>
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={!consentChecked} onClick={onConfirm}>
            Proceed with Patient Creation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
