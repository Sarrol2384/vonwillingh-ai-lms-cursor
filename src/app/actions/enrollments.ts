"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendRegistrationApproved } from "@/lib/email";

export async function approveEnrollment(enrollmentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Forbidden" };

  const { error } = await supabase
    .from("enrollments")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    })
    .eq("id", enrollmentId);
  if (error) return { error: error.message };

  // Send notification (non-fatal)
  try {
    const { data: enrollInfo } = await supabase
      .from("enrollments")
      .select("user_id, courses(title)")
      .eq("id", enrollmentId)
      .single();
    if (enrollInfo) {
      const { data: studentProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", enrollInfo.user_id)
        .single();
      // Use Supabase service role to get email — or skip gracefully
      const courseTitle = (enrollInfo.courses as { title?: string } | null)?.title ?? "Course";
      await sendRegistrationApproved("", studentProfile?.full_name ?? "Student", courseTitle);
    }
  } catch { /* non-fatal */ }

  revalidatePath("/admin/approvals");
  revalidatePath("/dashboard");
  return {};
}

export async function rejectEnrollment(enrollmentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Forbidden" };

  const { error } = await supabase
    .from("enrollments")
    .update({ status: "rejected" })
    .eq("id", enrollmentId);
  if (error) return { error: error.message };

  revalidatePath("/admin/approvals");
  revalidatePath("/dashboard");
  return {};
}
