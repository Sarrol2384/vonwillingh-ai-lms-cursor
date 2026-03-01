"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendAssignmentGraded } from "@/lib/email";

const PASS_MARK = 50;

export async function submitQuiz(
  assessmentId: string,
  moduleId: string,
  enrollmentId: string,
  answers: number[]
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", score: 0 };

  const { data: assessment } = await supabase
    .from("assessments")
    .select("config")
    .eq("id", assessmentId)
    .single();
  if (!assessment) return { error: "Assessment not found", score: 0 };

  const config = assessment.config as { questions?: { correctIndex: number }[] };
  const questions = config?.questions ?? [];
  let correct = 0;
  questions.forEach((q: { correctIndex: number }, i: number) => {
    if (answers[i] === q.correctIndex) correct++;
  });
  const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;

  const { error: subError } = await supabase.from("submissions").upsert(
    {
      assessment_id: assessmentId,
      enrollment_id: enrollmentId,
      payload: { answers },
      score,
      graded_at: new Date().toISOString(),
    },
    { onConflict: "assessment_id,enrollment_id" }
  );
  if (subError) return { error: subError.message, score: 0 };

  const { data: progress } = await supabase
    .from("module_progress")
    .select("id")
    .eq("enrollment_id", enrollmentId)
    .eq("module_id", moduleId)
    .single();

  if (progress) {
    await supabase
      .from("module_progress")
      .update({ quiz_passed: score >= PASS_MARK })
      .eq("id", progress.id);
  } else {
    await supabase.from("module_progress").insert({
      enrollment_id: enrollmentId,
      module_id: moduleId,
      quiz_passed: score >= PASS_MARK,
      assignment_passed: false,
    });
  }

  revalidatePath("/courses");
  return { score };
}

export async function gradeSubmission(
  submissionId: string,
  score: number,
  feedback: string,
  moduleId: string,
  enrollmentId: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "lecturer") return { error: "Forbidden" };

  const { error } = await supabase
    .from("submissions")
    .update({
      score,
      feedback: feedback || null,
      graded_at: new Date().toISOString(),
      graded_by: user.id,
    })
    .eq("id", submissionId);
  if (error) return { error: error.message };

  const { data: progress } = await supabase
    .from("module_progress")
    .select("id")
    .eq("enrollment_id", enrollmentId)
    .eq("module_id", moduleId)
    .single();

  if (progress) {
    await supabase
      .from("module_progress")
      .update({ assignment_passed: score >= PASS_MARK })
      .eq("id", progress.id);
  } else {
    await supabase.from("module_progress").insert({
      enrollment_id: enrollmentId,
      module_id: moduleId,
      quiz_passed: false,
      assignment_passed: score >= PASS_MARK,
    });
  }

  // Send notification (non-fatal)
  try {
    const { data: enrollment } = await supabase.from("enrollments").select("user_id").eq("id", enrollmentId).single();
    if (enrollment) {
      const { data: studentProfile } = await supabase.from("profiles").select("full_name").eq("id", enrollment.user_id).single();
      const { data: module } = await supabase.from("modules").select("title").eq("id", moduleId).single();
      await sendAssignmentGraded("", studentProfile?.full_name ?? "Student", module?.title ?? "Module", score, feedback || null);
    }
  } catch { /* non-fatal */ }

  revalidatePath("/lecturer/grading");
  revalidatePath("/admin");
  return {};
}
