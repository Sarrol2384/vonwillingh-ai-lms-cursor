import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { AssignmentForm } from "@/components/assignment-form";

export default async function AssignmentPage({
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
    .eq("type", "assignment")
    .single();
  if (!assessment) notFound();

  const config = assessment.config as {
    instructions?: string;
    max_score?: number;
  };

  const { data: existing } = await supabase
    .from("submissions")
    .select("id, score, feedback, graded_at, payload")
    .eq("assessment_id", assessmentId)
    .eq("enrollment_id", enrollmentId)
    .single();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{assessment.title}</h1>
      {config.instructions && (
        <p className="text-muted-foreground whitespace-pre-wrap">{config.instructions}</p>
      )}
      {existing ? (
        <div className="space-y-2 border rounded-lg p-4">
          <p className="font-medium">Submission received</p>
          {existing.graded_at ? (
            <>
              <p>Score: <strong>{existing.score ?? "—"}/{config.max_score ?? 100}</strong></p>
              {existing.feedback && <p>Feedback: {existing.feedback}</p>}
            </>
          ) : (
            <p className="text-muted-foreground">Awaiting grading.</p>
          )}
        </div>
      ) : (
        <AssignmentForm
          assessmentId={assessmentId}
          enrollmentId={enrollmentId}
          profileId={profile.id}
        />
      )}
    </div>
  );
}
