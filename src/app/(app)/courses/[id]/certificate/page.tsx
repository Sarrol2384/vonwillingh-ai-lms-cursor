import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { CertificateCard } from "@/components/certificate-card";

export default async function CourseCertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data: enrollData } = await supabase
    .from("enrollments")
    .select("id, courses(title, code)")
    .eq("user_id", profile.id)
    .eq("course_id", courseId)
    .eq("status", "approved")
    .single();
  if (!enrollData) notFound();

  type EnrollWithCourse = { id: string; courses: { title: string; code: string } | null };
  const enrollment = enrollData as unknown as EnrollWithCourse;

  const { data: cert } = await supabase
    .from("certificates")
    .select("id, certificate_number, issued_at")
    .eq("enrollment_id", enrollment.id)
    .single();

  const { data: modules } = await supabase.from("modules").select("id").eq("course_id", courseId);
  const moduleIds = (modules ?? []).map((m: { id: string }) => m.id);
  const { data: assessments } = moduleIds.length > 0
    ? await supabase.from("assessments").select("module_id, type").in("module_id", moduleIds)
    : { data: [] };
  const { data: progressRows } = await supabase
    .from("module_progress")
    .select("module_id, quiz_passed, assignment_passed")
    .eq("enrollment_id", enrollment.id);

  let allPassed = true;
  for (const mid of moduleIds) {
    const p = (progressRows ?? []).find((pr: { module_id: string }) => pr.module_id === mid);
    const quizOk = !(assessments ?? []).some((a: { module_id: string; type: string }) => a.module_id === mid && a.type === "quiz") || p?.quiz_passed;
    const assignOk = !(assessments ?? []).some((a: { module_id: string; type: string }) => a.module_id === mid && a.type === "assignment") || p?.assignment_passed;
    if (!quizOk || !assignOk) { allPassed = false; break; }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Certificate</h1>
      <CertificateCard
        enrollmentId={enrollment.id}
        studentName={profile.full_name ?? "Student"}
        courseTitle={enrollment.courses?.title ?? "Course"}
        courseCode={enrollment.courses?.code ?? ""}
        certificate={cert ?? null}
        courseComplete={allPassed}
      />
    </div>
  );
}
