"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface AssignmentFormProps {
  assessmentId: string;
  enrollmentId: string;
  profileId: string;
}

export function AssignmentForm({ assessmentId, enrollmentId, profileId }: AssignmentFormProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Select a file to upload");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "pdf";
      const path = `submissions/${profileId}/${assessmentId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("assignments")
        .upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("assignments").getPublicUrl(path);
      const { error: subError } = await supabase.from("submissions").insert({
        assessment_id: assessmentId,
        enrollment_id: enrollmentId,
        payload: { file_url: urlData.publicUrl },
      });
      if (subError) throw subError;

      toast.success("Assignment submitted. Awaiting grading.");
      router.refresh();
      router.back();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Upload your work (PDF or document)</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.doc,.docx,.zip"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Uploading..." : "Submit assignment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
