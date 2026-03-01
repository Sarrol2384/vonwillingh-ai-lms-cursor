import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ClipboardList } from "lucide-react";

export default async function LecturerDashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, code")
    .eq("created_by", profile.id)
    .order("created_at", { ascending: false });

  type SubWithCourse = { id: string; assessments: { modules: { courses: { created_by: string }[] }[] }[] };
  const { data: pendingSubmissions } = await supabase
    .from("submissions")
    .select("id, assessments!inner(modules!inner(courses!inner(created_by)))")
    .is("graded_at", null);
  const myPending = ((pendingSubmissions as unknown as SubWithCourse[] | null) ?? []).filter(
    (s) => s.assessments?.[0]?.modules?.[0]?.courses?.[0]?.created_by === profile.id
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Lecturer Dashboard</h1>
        <p className="text-muted-foreground">Manage your courses and grading.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              My courses
            </CardTitle>
            <CardDescription>Courses you created</CardDescription>
          </CardHeader>
          <CardContent>
            {courses && courses.length > 0 ? (
              <ul className="space-y-2">
                {courses.map((c: { id: string; title: string; code: string }) => (
                  <li key={c.id}>
                    <Link href={`/lecturer/courses/${c.id}`}>
                      <Button variant="link" className="p-0 h-auto">{c.title} ({c.code})</Button>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No courses yet.</p>
            )}
            <Link href="/admin/courses/new" className="mt-4 inline-block">
              <Button variant="outline" size="sm">Create course</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Grading queue
            </CardTitle>
            <CardDescription>Submissions awaiting grading</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{myPending.length}</p>
            <Link href="/lecturer/grading">
              <Button variant="outline" size="sm" className="mt-2">View queue</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
