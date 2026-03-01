import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, CheckCircle, BookOpen, Award } from "lucide-react";
import { CardDescription } from "@/components/ui/card";

const PASS_MARK = 50;

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", profile.id)
    .eq("course_id", courseId)
    .eq("status", "approved")
    .single();
  if (!enrollment) notFound();

  const { data: course } = await supabase.from("courses").select("*").eq("id", courseId).single();
  if (!course) notFound();

  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, description, sequence_order")
    .eq("course_id", courseId)
    .order("sequence_order");

  const { data: progressRows } = await supabase
    .from("module_progress")
    .select("module_id, quiz_passed, assignment_passed")
    .eq("enrollment_id", enrollment.id);

  const progressByModule = new Map(
    (progressRows ?? []).map((p: { module_id: string; quiz_passed: boolean; assignment_passed: boolean }) => [
      p.module_id,
      { quiz_passed: p.quiz_passed, assignment_passed: p.assignment_passed },
    ])
  );

  const { data: assessmentsByModule } = await supabase
    .from("assessments")
    .select("module_id, type")
    .in("module_id", (modules ?? []).map((m: { id: string }) => m.id));
  const hasQuiz = new Map<string, boolean>();
  const hasAssignment = new Map<string, boolean>();
  (assessmentsByModule ?? []).forEach((a: { module_id: string; type: string }) => {
    if (a.type === "quiz") hasQuiz.set(a.module_id, true);
    if (a.type === "assignment") hasAssignment.set(a.module_id, true);
  });

  let prevPassed = true;
  const modulesWithLock = (modules ?? []).map((m: { id: string; title: string; description: string | null; sequence_order: number }) => {
    const p = progressByModule.get(m.id);
    const needQuiz = hasQuiz.get(m.id) ?? false;
    const needAssignment = hasAssignment.get(m.id) ?? false;
    const quizOk = !needQuiz || (p?.quiz_passed ?? false);
    const assignmentOk = !needAssignment || (p?.assignment_passed ?? false);
    const passed = quizOk && assignmentOk;
    const unlocked = prevPassed;
    prevPassed = passed;
    return { ...m, unlocked, passed };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <p className="text-muted-foreground">{course.code} — NQF {course.nqf_level ?? "—"} · {course.credits ?? "—"} credits</p>
      </div>
      <div className="flex justify-end">
        <Link href={`/courses/${courseId}/certificate`}>
          <Button variant="outline">
            <Award className="h-4 w-4 mr-2" />
            Certificate
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Modules
          </CardTitle>
          <CardDescription>Complete each module in order. Pass mark: {PASS_MARK}%.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {modulesWithLock.map((m) => (
              <li key={m.id} className="flex items-center gap-3 border rounded-lg p-3">
                {m.unlocked ? (
                  <Link href={`/courses/${courseId}/modules/${m.id}`} className="flex-1">
                    <div className="flex items-center gap-2">
                      {m.passed ? <CheckCircle className="h-5 w-5 text-green-600" /> : <BookOpen className="h-5 w-5 text-muted-foreground" />}
                      <span className="font-medium">{m.title}</span>
                      {m.passed && <Badge variant="secondary">Passed</Badge>}
                    </div>
                    {m.description && <p className="text-sm text-muted-foreground mt-1">{m.description}</p>}
                  </Link>
                ) : (
                  <div className="flex-1 flex items-center gap-2 opacity-60">
                    <Lock className="h-5 w-5" />
                    <span className="font-medium">{m.title}</span>
                    <Badge variant="outline">Complete previous module</Badge>
                  </div>
                )}
                {m.unlocked && (
                  <Link href={`/courses/${courseId}/modules/${m.id}`}>
                    <Button size="sm">Open</Button>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
