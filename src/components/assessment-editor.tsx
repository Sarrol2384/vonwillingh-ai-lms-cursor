"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

interface AssessmentEditorProps {
  moduleId: string;
  existing?: {
    id: string;
    type: "quiz" | "assignment";
    title: string;
    config: Record<string, unknown>;
  } | null;
  type: "quiz" | "assignment";
}

export function AssessmentEditor({ moduleId, existing, type }: AssessmentEditorProps) {
  const isQuiz = type === "quiz";
  const [title, setTitle] = useState(existing?.title ?? (isQuiz ? "Module Quiz" : "Module Assignment"));
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    isQuiz
      ? ((existing?.config as { questions?: QuizQuestion[] })?.questions ?? [])
      : []
  );
  const [instructions, setInstructions] = useState(
    isQuiz ? "" : ((existing?.config as { instructions?: string })?.instructions ?? "")
  );
  const [maxScore, setMaxScore] = useState(
    isQuiz ? "" : String((existing?.config as { max_score?: number })?.max_score ?? 100)
  );
  const [loading, setLoading] = useState(false);

  function addQuestion() {
    setQuestions((q) => [...q, { question: "", options: ["", "", "", ""], correctIndex: 0 }]);
  }

  function removeQuestion(i: number) {
    setQuestions((q) => q.filter((_, j) => j !== i));
  }

  function updateQuestion(i: number, field: keyof QuizQuestion, value: unknown) {
    setQuestions((q) => {
      const next = [...q];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }

  function updateOption(qi: number, oi: number, value: string) {
    setQuestions((q) => {
      const next = [...q];
      const opts = [...next[qi].options];
      opts[oi] = value;
      next[qi] = { ...next[qi], options: opts };
      return next;
    });
  }

  async function handleSave() {
    if (!title.trim()) { toast.error("Enter a title"); return; }
    if (isQuiz && questions.length === 0) { toast.error("Add at least one question"); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const config = isQuiz
        ? { questions }
        : { instructions, max_score: parseInt(maxScore, 10) || 100 };

      if (existing) {
        const { error } = await supabase
          .from("assessments")
          .update({ title, config })
          .eq("id", existing.id);
        if (error) throw error;
        toast.success("Assessment updated");
      } else {
        const { error } = await supabase.from("assessments").insert({
          module_id: moduleId,
          type,
          title,
          config,
        });
        if (error) throw error;
        toast.success("Assessment created");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isQuiz ? "Quiz" : "Assignment"}</CardTitle>
        <CardDescription>{isQuiz ? "Auto-graded multiple choice" : "File upload, manually graded"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        {isQuiz ? (
          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={i} className="border rounded-lg p-3 space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Question {i + 1}</Label>
                  <Button size="icon" variant="ghost" onClick={() => removeQuestion(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  value={q.question}
                  onChange={(e) => updateQuestion(i, "question", e.target.value)}
                  placeholder="Question text"
                  rows={2}
                />
                {q.options.map((opt, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${i}`}
                      checked={q.correctIndex === j}
                      onChange={() => updateQuestion(i, "correctIndex", j)}
                      className="accent-primary"
                    />
                    <Input
                      value={opt}
                      onChange={(e) => updateOption(i, j, e.target.value)}
                      placeholder={`Option ${j + 1}`}
                      className="flex-1"
                    />
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">Select radio = correct answer</p>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addQuestion}>
              <Plus className="h-4 w-4 mr-1" />
              Add question
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Instructions</Label>
              <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Max score</Label>
              <Input type="number" min={1} value={maxScore} onChange={(e) => setMaxScore(e.target.value)} className="w-32" />
            </div>
          </div>
        )}

        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : existing ? "Update" : "Create"}
        </Button>
      </CardContent>
    </Card>
  );
}
