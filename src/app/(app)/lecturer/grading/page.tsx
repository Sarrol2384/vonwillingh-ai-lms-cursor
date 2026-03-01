import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GradeForm } from "@/components/grade-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SubmissionRow = {
  id: string;
  created_at: string;
  enrollment_id: string;
  payload: { file_url?: string } | null;
  assessments: {
    id: string;
    title: string;
    module_id: string;
    modules: {
      id: string;
      title: string;
      course_id: string;
      courses: { id: string; title: string; created_by: string }[];
    }[];
  }[];
};

export default async function GradingQueuePage() {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "lecturer" && profile.role !== "admin"))
    redirect("/dashboard");

  const supabase = await createClient();
  const { data } = await supabase
    .from("submissions")
    .select(
      "id, created_at, payload, enrollment_id, assessments!inner(id, title, module_id, modules!inner(id, title, course_id, courses!inner(id, title, created_by)))"
    )
    .is("graded_at", null)
    .order("created_at", { ascending: true });

  const submissions = (data as unknown as SubmissionRow[] | null) ?? [];

  const mine = submissions.filter((s) => {
    if (profile.role === "admin") return true;
    return s.assessments?.[0]?.modules?.[0]?.courses?.[0]?.created_by === profile.id;
  });

  const enrollmentIds = Array.from(new Set(mine.map((s) => s.enrollment_id)));
  const { data: enrollments } = enrollmentIds.length > 0
    ? await supabase.from("enrollments").select("id, user_id").in("id", enrollmentIds)
    : { data: [] };
  const userIds = Array.from(new Set((enrollments ?? []).map((e: { user_id: string }) => e.user_id)));
  const { data: studentProfiles } = userIds.length > 0
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] };

  const enrollmentToUser = new Map((enrollments ?? []).map((e: { id: string; user_id: string }) => [e.id, e.user_id]));
  const profileMap = new Map((studentProfiles ?? []).map((p: { id: string; full_name: string | null }) => [p.id, p.full_name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Grading queue</h1>
        <p className="text-muted-foreground">Assignment submissions awaiting grading.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Pending submissions</CardTitle>
          <CardDescription>Pass mark: 50%</CardDescription>
        </CardHeader>
        <CardContent>
          {mine.length > 0 ? (
            <div className="space-y-6">
              {mine.map((s) => {
                const studentId = enrollmentToUser.get(s.enrollment_id) ?? "";
                const studentName = profileMap.get(studentId) ?? "Unknown";
                const assessment = s.assessments?.[0];
                const mod = assessment?.modules?.[0];
                const course = mod?.courses?.[0];
                return (
                  <div key={s.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <p className="font-medium">{assessment?.title ?? "Assignment"}</p>
                        <p className="text-sm text-muted-foreground">
                          {course?.title ?? "Course"} — Student: {studentName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Submitted: {new Date(s.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {s.payload?.file_url && (
                        <a
                          href={s.payload.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline text-sm"
                        >
                          View submission
                        </a>
                      )}
                    </div>
                    <GradeForm
                      submissionId={s.id}
                      moduleId={mod?.id ?? ""}
                      enrollmentId={s.enrollment_id}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground">No pending submissions.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
