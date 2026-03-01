import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { QuizForm } from "@/components/quiz-form";

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ enrollment?: string }>;
}) {
  const { id: assessmentId } = await params;
  const { enrollment: enrollmentId } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile || !enrollmentId) redirect("/dashboard");

  const supabase = await createClient();
  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, module_id, title, config")
    .eq("id", assessmentId)
    .eq("type", "quiz")
    .single();
  if (!assessment) notFound();

  const config = assessment.config as { questions?: { question: string; options: string[]; correctIndex: number }[] };
  // Strip correctIndex before sending to client — answers are only checked server-side
  const questions = (config?.questions ?? []).map(({ question, options }) => ({ question, options }));

  const { data: existing } = await supabase
    .from("submissions")
    .select("id, score")
    .eq("assessment_id", assessmentId)
    .eq("enrollment_id", enrollmentId)
    .single();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{assessment.title}</h1>
      {existing ? (
        <p className="text-muted-foreground">You already submitted. Score: {existing.score ?? "—"}%</p>
      ) : questions.length > 0 ? (
        <QuizForm
          assessmentId={assessmentId}
          moduleId={assessment.module_id}
          enrollmentId={enrollmentId}
          questions={questions}
        />
      ) : (
        <p className="text-muted-foreground">No questions in this quiz.</p>
      )}
    </div>
  );
}
