import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Award } from "lucide-react";

type EnrollmentRow = {
  id: string;
  course_id: string;
  courses: { id: string; title: string; code: string } | null;
};

type CertRow = {
  id: string;
  certificate_number: string;
  enrollments: { courses: { title: string } | null } | null;
};

export default async function StudentDashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "student") {
    if (profile.role === "admin") redirect("/admin/dashboard");
    if (profile.role === "lecturer") redirect("/lecturer/dashboard");
  }

  const supabase = await createClient();
  const { data: enrollData } = await supabase
    .from("enrollments")
    .select("id, course_id, courses(id, title, code)")
    .eq("user_id", profile.id)
    .eq("status", "approved");
  const enrollments = (enrollData as unknown as EnrollmentRow[] | null) ?? [];

  const { data: certData } = await supabase
    .from("certificates")
    .select("id, certificate_number, enrollments!inner(user_id, courses(title))")
    .eq("enrollments.user_id", profile.id);
  const certificates = (certData as unknown as CertRow[] | null) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {profile.full_name ?? "Student"}.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              My courses
            </CardTitle>
            <CardDescription>Courses you are enrolled in</CardDescription>
          </CardHeader>
          <CardContent>
            {enrollments.length > 0 ? (
              <ul className="space-y-2">
                {enrollments.map((e) => (
                  <li key={e.id}>
                    <Link href={`/courses/${e.courses?.id ?? e.course_id}`}>
                      <Button variant="link" className="p-0 h-auto">
                        {e.courses?.title ?? "Course"} ({e.courses?.code ?? ""})
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No courses yet.</p>
            )}
            <Link href="/register" className="mt-4 inline-block">
              <Button variant="outline" size="sm">Register for course</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Certificates
            </CardTitle>
            <CardDescription>Your completed course certificates</CardDescription>
          </CardHeader>
          <CardContent>
            {certificates.length > 0 ? (
              <ul className="space-y-2">
                {certificates.map((c) => (
                  <li key={c.id}>
                    <Link href={`/verify/${c.certificate_number}`}>
                      <Button variant="link" className="p-0 h-auto">
                        {c.enrollments?.courses?.title ?? "Certificate"} — {c.certificate_number}
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Complete a course to earn a certificate.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
