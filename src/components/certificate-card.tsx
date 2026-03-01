"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateCertificate } from "@/app/actions/certificates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Download } from "lucide-react";
import { toast } from "sonner";

interface CertificateCardProps {
  enrollmentId: string;
  studentName: string;
  courseTitle: string;
  courseCode: string;
  certificate: { id: string; certificate_number: string; issued_at: string } | null;
  courseComplete: boolean;
}

export function CertificateCard({
  enrollmentId,
  studentName,
  courseTitle,
  courseCode,
  certificate: initialCert,
  courseComplete,
}: CertificateCardProps) {
  const router = useRouter();
  const cert = initialCert;
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await generateCertificate(enrollmentId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Certificate generated!");
      router.refresh();
    } catch {
      toast.error("Failed to generate certificate");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!cert) return;
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFontSize(36);
    doc.setFont("helvetica", "bold");
    doc.text("Certificate of Completion", 148.5, 60, { align: "center" });
    doc.setFontSize(18);
    doc.setFont("helvetica", "normal");
    doc.text("This certifies that", 148.5, 85, { align: "center" });
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text(studentName, 148.5, 105, { align: "center" });
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text("has successfully completed", 148.5, 120, { align: "center" });
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(courseTitle, 148.5, 138, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Course code: ${courseCode}`, 148.5, 152, { align: "center" });
    doc.text(`Date: ${new Date(cert.issued_at).toLocaleDateString("en-ZA")}`, 148.5, 162, { align: "center" });
    doc.text(`Certificate number: ${cert.certificate_number}`, 148.5, 172, { align: "center" });
    doc.text("VonWillingh AI LMS", 148.5, 186, { align: "center" });
    doc.save(`certificate-${cert.certificate_number}.pdf`);
  }

  if (cert) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-6 w-6 text-yellow-500" />
            Certificate of Completion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg p-6 text-center space-y-2">
            <p className="text-xl font-bold">{studentName}</p>
            <p className="text-muted-foreground">has completed</p>
            <p className="text-2xl font-semibold">{courseTitle}</p>
            <p className="text-sm text-muted-foreground">
              Issued: {new Date(cert.issued_at).toLocaleDateString("en-ZA")}
            </p>
            <p className="text-xs text-muted-foreground font-mono">{cert.certificate_number}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" asChild>
              <a href={`/verify/${cert.certificate_number}`} target="_blank">Verify</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Certificate</CardTitle>
      </CardHeader>
      <CardContent>
        {courseComplete ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">You have completed this course. Generate your certificate.</p>
            <Button onClick={handleGenerate} disabled={loading}>
              <Award className="h-4 w-4 mr-2" />
              {loading ? "Generating..." : "Generate certificate"}
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground">Complete all modules to earn your certificate.</p>
        )}
      </CardContent>
    </Card>
  );
}
