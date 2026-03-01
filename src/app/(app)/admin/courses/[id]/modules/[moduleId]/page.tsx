import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModuleForm } from "@/components/module-form";
import { UnitList } from "@/components/unit-list";
import { AssessmentEditor } from "@/components/assessment-editor";
import { ArrowLeft } from "lucide-react";

export default async function EditModulePage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>;
}) {
  const { id: courseId, moduleId } = await params;
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "admin" && profile.role !== "lecturer")) redirect("/dashboard");

  const supabase = await createClient();
  const { data: module, error } = await supabase
    .from("modules")
    .select("*")
    .eq("id", moduleId)
    .eq("course_id", courseId)
    .single();
  if (error || !module) notFound();

  const { data: units } = await supabase
    .from("units")
    .select("id, title, sequence_order")
    .eq("module_id", moduleId)
    .order("sequence_order");

  const { data: assessments } = await supabase
    .from("assessments")
    .select("id, type, title, config")
    .eq("module_id", moduleId);

  const quiz = assessments?.find((a: { type: string }) => a.type === "quiz") ?? null;
  const assignment = assessments?.find((a: { type: string }) => a.type === "assignment") ?? null;

  return (
    <div className="space-y-8">
      <Link href={`/admin/courses/${courseId}`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to course
        </Button>
      </Link>
      <div>
        <h1 className="text-2xl font-bold">Module: {module.title}</h1>
      </div>
      <ModuleForm module={module} />
      <Card>
        <CardHeader>
          <CardTitle>Units</CardTitle>
        </CardHeader>
        <CardContent>
          <UnitList moduleId={moduleId} units={units ?? []} />
        </CardContent>
      </Card>
      <AssessmentEditor
        moduleId={moduleId}
        type="quiz"
        existing={quiz as { id: string; type: "quiz" | "assignment"; title: string; config: Record<string, unknown> } | null}
      />
      <AssessmentEditor
        moduleId={moduleId}
        type="assignment"
        existing={assignment as { id: string; type: "quiz" | "assignment"; title: string; config: Record<string, unknown> } | null}
      />
    </div>
  );
}
