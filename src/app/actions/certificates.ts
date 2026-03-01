"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function makeCertNumber(courseId: string, enrollmentId: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const courseShort = courseId.slice(-6).toUpperCase();
  const enrollShort = enrollmentId.slice(-6).toUpperCase();
  return `VW-${courseShort}-${enrollShort}-${date}`;
}

export async function generateCertificate(enrollmentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Verify user owns enrollment and course is complete
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, user_id, course_id, courses(title, code)")
    .eq("id", enrollmentId)
    .single();
  if (!enrollment || enrollment.user_id !== user.id) return { error: "Not found" };

  // Check all modules passed
  const { data: modules } = await supabase
    .from("modules")
    .select("id")
    .eq("course_id", enrollment.course_id);
  const moduleIds = (modules ?? []).map((m: { id: string }) => m.id);

  const { data: assessments } = await supabase
    .from("assessments")
    .select("module_id, type")
    .in("module_id", moduleIds);

  const modulesWithAssessments = new Set(
    (assessments ?? []).map((a: { module_id: string }) => a.module_id)
  );

  const { data: progressRows } = await supabase
    .from("module_progress")
    .select("module_id, quiz_passed, assignment_passed")
    .eq("enrollment_id", enrollmentId);

  for (const mid of moduleIds) {
    if (!modulesWithAssessments.has(mid)) continue;
    const p = (progressRows ?? []).find((pr: { module_id: string }) => pr.module_id === mid);
    const quizOk = !assessments?.some((a: { module_id: string; type: string }) => a.module_id === mid && a.type === "quiz") || p?.quiz_passed;
    const assignOk = !assessments?.some((a: { module_id: string; type: string }) => a.module_id === mid && a.type === "assignment") || p?.assignment_passed;
    if (!quizOk || !assignOk) return { error: "Not all modules are completed" };
  }

  // Check if certificate already exists
  const { data: existing } = await supabase
    .from("certificates")
    .select("id, certificate_number")
    .eq("enrollment_id", enrollmentId)
    .single();
  if (existing) return { certificateNumber: existing.certificate_number };

  const certNumber = makeCertNumber(enrollment.course_id, enrollmentId);
  const { data: cert, error } = await supabase
    .from("certificates")
    .insert({
      enrollment_id: enrollmentId,
      certificate_number: certNumber,
    })
    .select("id, certificate_number")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/courses");
  return { certificateNumber: cert.certificate_number };
}
