import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseForm } from "@/components/course-form";
import { ModuleList } from "@/components/module-list";
import { ArrowLeft } from "lucide-react";

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "admin" && profile.role !== "lecturer")) redirect("/dashboard");

  const supabase = await createClient();
  const { data: course, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !course) notFound();

  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, sequence_order")
    .eq("course_id", id)
    .order("sequence_order");

  return (
    <div className="space-y-8">
      <Link href="/admin/courses">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to courses
        </Button>
      </Link>
      <div>
        <h1 className="text-2xl font-bold">Edit course</h1>
        <p className="text-muted-foreground">{course.code}</p>
      </div>
      <CourseForm course={course} createdBy={profile.id} />
      <Card>
        <CardHeader>
          <CardTitle>Modules</CardTitle>
          <CardDescription>Add and reorder modules. Pass mark: 50%.</CardDescription>
        </CardHeader>
        <CardContent>
          <ModuleList courseId={id} modules={modules ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
