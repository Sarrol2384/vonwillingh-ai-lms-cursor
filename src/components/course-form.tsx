"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface CourseFormProps {
  course?: {
    id: string;
    title: string;
    code: string;
    description: string | null;
    nqf_level: number | null;
    credits: number | null;
  };
  createdBy: string;
}

export function CourseForm({ course, createdBy }: CourseFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(course?.title ?? "");
  const [code, setCode] = useState(course?.code ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [nqfLevel, setNqfLevel] = useState(course?.nqf_level?.toString() ?? "");
  const [credits, setCredits] = useState(course?.credits?.toString() ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const payload = {
        title,
        code: code.trim(),
        description: description || null,
        nqf_level: nqfLevel ? parseInt(nqfLevel, 10) : null,
        credits: credits ? parseInt(credits, 10) : null,
        created_by: course ? undefined : createdBy,
      };
      if (course) {
        const { error } = await supabase.from("courses").update(payload).eq("id", course.id);
        if (error) throw error;
        toast.success("Course updated");
      } else {
        const { data, error } = await supabase.from("courses").insert(payload).select("id").single();
        if (error) throw error;
        toast.success("Course created");
        router.push(`/admin/courses/${data.id}`);
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{course ? "Edit course" : "Course details"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="e.g. CS101" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nqf">NQF level</Label>
              <Input id="nqf" type="number" min={1} max={10} value={nqfLevel} onChange={(e) => setNqfLevel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credits">Credits</Label>
              <Input id="credits" type="number" min={0} value={credits} onChange={(e) => setCredits(e.target.value)} />
            </div>
          </div>
          <Button type="submit" disabled={loading}>{course ? "Update" : "Create"}</Button>
        </CardContent>
      </form>
    </Card>
  );
}
