import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export default async function LecturerCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = await params;
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "lecturer" && profile.role !== "admin")) redirect("/dashboard");

  const supabase = await createClient();
  const { data: course } = await supabase.from("courses").select("*").eq("id", courseId).single();
  if (!course) notFound();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, user_id, status, created_at")
    .eq("course_id", courseId)
    .eq("status", "approved");

  const userIds = (enrollments ?? []).map((e: { user_id: string }) => e.user_id);
  const { data: students } = userIds.length > 0
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] };
  const studentMap = new Map((students ?? []).map((s: { id: string; full_name: string | null }) => [s.id, s.full_name]));

  const { data: modules } = await supabase.from("modules").select("id").eq("course_id", courseId);
  const totalModules = modules?.length ?? 0;

  const enrollmentIds = (enrollments ?? []).map((e: { id: string }) => e.id);
  const { data: progressAll } = enrollmentIds.length > 0
    ? await supabase.from("module_progress").select("enrollment_id, quiz_passed, assignment_passed").in("enrollment_id", enrollmentIds)
    : { data: [] };

  return (
    <div className="space-y-6">
      <Link href="/lecturer/dashboard">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </Link>
      <div>
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <p className="text-muted-foreground">{course.code}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Enrolled students ({enrollments?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {enrollments && enrollments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Modules passed</TableHead>
                  <TableHead>Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((e: { id: string; user_id: string }) => {
                  const ep = (progressAll ?? []).filter((p: { enrollment_id: string; quiz_passed: boolean; assignment_passed: boolean }) =>
                    p.enrollment_id === e.id && p.quiz_passed && p.assignment_passed
                  );
                  const passed = ep.length;
                  const pct = totalModules > 0 ? Math.round((passed / totalModules) * 100) : 0;
                  return (
                    <TableRow key={e.id}>
                      <TableCell>{studentMap.get(e.user_id) ?? "—"}</TableCell>
                      <TableCell>{passed} / {totalModules}</TableCell>
                      <TableCell>
                        <Badge variant={pct === 100 ? "default" : "secondary"}>{pct}%</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No enrolled students.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
