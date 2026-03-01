"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { gradeSubmission } from "@/app/actions/assessments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface GradeFormProps {
  submissionId: string;
  moduleId: string;
  enrollmentId: string;
}

export function GradeForm({ submissionId, moduleId, enrollmentId }: GradeFormProps) {
  const router = useRouter();
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const scoreNum = parseFloat(score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      toast.error("Score must be 0–100");
      return;
    }
    setLoading(true);
    try {
      const res = await gradeSubmission(submissionId, scoreNum, feedback, moduleId, enrollmentId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`Graded: ${scoreNum}%`);
      router.refresh();
    } catch {
      toast.error("Failed to grade");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-4 items-end flex-wrap">
        <div className="space-y-1">
          <Label htmlFor={`score-${submissionId}`}>Score (0–100)</Label>
          <Input
            id={`score-${submissionId}`}
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="w-28"
            required
          />
        </div>
        <div className="flex-1 space-y-1">
          <Label htmlFor={`fb-${submissionId}`}>Feedback (optional)</Label>
          <Textarea
            id={`fb-${submissionId}`}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={1}
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save grade"}
        </Button>
      </div>
    </form>
  );
}
