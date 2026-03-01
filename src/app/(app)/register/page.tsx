import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RegistrationForm } from "@/components/registration-form";

export default async function RegisterPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "student") redirect("/dashboard");

  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, code")
    .order("title");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Register for a course</h1>
        <p className="text-muted-foreground">Submit your details and proof of payment for approval.</p>
      </div>
      <RegistrationForm profile={profile} courses={courses ?? []} />
    </div>
  );
}
