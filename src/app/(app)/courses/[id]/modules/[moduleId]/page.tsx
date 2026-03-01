import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarkCompleteButton } from "@/components/mark-complete-button";
import { QuizLink } from "@/components/quiz-link";
import { AssignmentLink } from "@/components/assignment-link";
import { ArrowLeft, FileText, Video } from "lucide-react";

export default async function ModuleViewPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>;
}) {
  const { id: courseId, moduleId } = await params;
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

  const { data: module } = await supabase
    .from("modules")
    .select("*")
    .eq("id", moduleId)
    .eq("course_id", courseId)
    .single();
  if (!module) notFound();

  const { data: units } = await supabase
    .from("units")
    .select("id, title, content, video_url, sequence_order")
    .eq("module_id", moduleId)
    .order("sequence_order");

  const { data: completed } = await supabase
    .from("unit_completions")
    .select("unit_id")
    .eq("enrollment_id", enrollment.id);
  const completedSet = new Set((completed ?? []).map((c: { unit_id: string }) => c.unit_id));

  const { data: assessments } = await supabase
    .from("assessments")
    .select("id, type, title")
    .eq("module_id", moduleId);

  const quiz = assessments?.find((a: { type: string }) => a.type === "quiz");
  const assignment = assessments?.find((a: { type: string }) => a.type === "assignment");

  return (
    <div className="space-y-8">
      <Link href={`/courses/${courseId}`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to course
        </Button>
      </Link>
      <div>
        <h1 className="text-2xl font-bold">{module.title}</h1>
        {module.description && <p className="text-muted-foreground">{module.description}</p>}
      </div>

      <div className="space-y-6">
        {(units ?? []).map((u: { id: string; title: string; content: string | null; video_url: string | null }) => (
          <Card key={u.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {u.title}
              </CardTitle>
              <MarkCompleteButton
                enrollmentId={enrollment.id}
                unitId={u.id}
                completed={completedSet.has(u.id)}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              {u.video_url && (
                <div>
                  <a href={u.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary underline">
                    <Video className="h-4 w-4" />
                    Watch video
                  </a>
                </div>
              )}
              {u.content && (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {u.content}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {quiz && <QuizLink assessmentId={quiz.id} enrollmentId={enrollment.id} title={quiz.title} />}
            {assignment && <AssignmentLink assessmentId={assignment.id} enrollmentId={enrollment.id} title={assignment.title} />}
            {!quiz && !assignment && <p className="text-muted-foreground">No assessments for this module.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
