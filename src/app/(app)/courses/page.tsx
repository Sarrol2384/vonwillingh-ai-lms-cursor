import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

export default async function CoursesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("id, course_id, courses(id, title, code, description)")
    .eq("user_id", profile.id)
    .eq("status", "approved");

  type EnrollmentRow = {
    id: string;
    course_id: string;
    courses: { id: string; title: string; code: string; description: string | null } | null;
  };
  const enrollments = (data as unknown as EnrollmentRow[] | null) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My courses</h1>
        <p className="text-muted-foreground">Courses you are enrolled in.</p>
      </div>
      {enrollments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {enrollments.map((e) => (
            <Card key={e.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {e.courses?.title ?? "Course"}
                </CardTitle>
                <CardDescription>{e.courses?.code ?? ""} — {e.courses?.description ?? ""}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/courses/${e.courses?.id ?? e.course_id}`}>
                  <Button>Open course</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">You are not enrolled in any course yet. Register to get started.</p>
            <Link href="/register" className="mt-4 inline-block">
              <Button>Register for course</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
