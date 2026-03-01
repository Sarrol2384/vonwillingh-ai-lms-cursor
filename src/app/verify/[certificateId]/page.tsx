import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";

type CertWithEnrollment = {
  id: string;
  certificate_number: string;
  issued_at: string;
  enrollments: {
    user_id: string;
    courses: { title: string; code: string } | null;
  } | null;
};

export default async function VerifyPage({ params }: { params: Promise<{ certificateId: string }> }) {
  const { certificateId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("certificates")
    .select("id, certificate_number, issued_at, enrollments(user_id, courses(title, code))")
    .eq("certificate_number", certificateId)
    .single();

  const cert = data as unknown as CertWithEnrollment | null;

  if (!cert) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-6 w-6" />
              Certificate not found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No certificate found for ID: <code className="font-mono">{certificateId}</code>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", cert.enrollments?.user_id ?? "")
    .single();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Certificate verified
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Badge variant="secondary" className="font-mono">
            {cert.certificate_number}
          </Badge>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Student</p>
              <p className="font-semibold">{profile?.full_name ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Course</p>
              <p className="font-semibold">{cert.enrollments?.courses?.title ?? "—"}</p>
              <p className="text-sm text-muted-foreground">{cert.enrollments?.courses?.code ?? ""}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Issued</p>
              <p className="font-semibold">
                {new Date(cert.issued_at).toLocaleDateString("en-ZA", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Issued by VonWillingh AI LMS</p>
        </CardContent>
      </Card>
    </div>
  );
}
