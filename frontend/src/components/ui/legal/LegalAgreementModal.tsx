// src/components/ui/LegalAgreementModal.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Download, Printer } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface LegalAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  title: string;
  description?: string;
  content: React.ReactNode;
  showButtons?: boolean;
  acceptLabel?: string;
  declineLabel?: string;
}

export function LegalAgreementModal({
  isOpen,
  onClose,
  onAccept,
  onDecline,
  title,
  description,
  content,
  showButtons = true,
  acceptLabel = "I Accept",
  declineLabel = "I Decline",
}: LegalAgreementModalProps) {
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Function to generate and download PDF
  const handleExportPDF = async () => {
    if (!contentRef.current) return;

    try {
      const contentElement = contentRef.current;
      const canvas = await html2canvas(contentElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Calculate dimensions to fit the content on the PDF
      const imgWidth = 210; // A4 width in mm (210mm)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add the image to the PDF
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      // Save the PDF
      pdf.save(`${title.replace(/\s+/g, "_").toLowerCase()}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  // Function to open print dialog
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const contentHtml = contentRef.current?.innerHTML || "";

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 20px;
              color: #333;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 16px;
            }
            h2 {
              font-size: 20px;
              margin-top: 20px;
              margin-bottom: 12px;
            }
            p {
              margin-bottom: 12px;
            }
            .date {
              margin-top: 40px;
            }
            .signature {
              margin-top: 80px;
              border-top: 1px solid #000;
              padding-top: 10px;
              max-width: 300px;
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${contentHtml}
          <div class="date">Date: ${new Date().toLocaleDateString()}</div>
          <div class="signature">Signature</div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div
          className="overflow-y-auto my-6 pr-4"
          style={{ maxHeight: "60vh" }}
        >
          <div ref={contentRef}>{content}</div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-4 sm:gap-2 items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>

          {showButtons && (
            <div className="flex gap-2">
              {onDecline && (
                <Button variant="outline" onClick={onDecline}>
                  {declineLabel}
                </Button>
              )}
              {onAccept && <Button onClick={onAccept}>{acceptLabel}</Button>}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
