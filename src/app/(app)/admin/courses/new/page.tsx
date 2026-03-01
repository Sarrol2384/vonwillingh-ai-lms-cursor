import { getCurrentProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CourseForm } from "@/components/course-form";

export default async function NewCoursePage() {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "admin" && profile.role !== "lecturer")) redirect("/dashboard");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New course</h1>
        <p className="text-muted-foreground">Create a new course.</p>
      </div>
      <CourseForm createdBy={profile.id} />
    </div>
  );
}
