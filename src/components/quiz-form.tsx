"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitQuiz } from "@/app/actions/assessments";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

interface QuizFormProps {
  assessmentId: string;
  moduleId: string;
  enrollmentId: string;
  questions: { question: string; options: string[]; correctIndex: number }[];
}

export function QuizForm({ assessmentId, moduleId, enrollmentId, questions }: QuizFormProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<number[]>(questions.map(() => -1));
  const [loading, setLoading] = useState(false);

  function setAnswer(i: number, value: number) {
    setAnswers((a) => {
      const next = [...a];
      next[i] = value;
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (answers.some((a) => a < 0)) {
      toast.error("Answer all questions");
      return;
    }
    setLoading(true);
    try {
      const res = await submitQuiz(assessmentId, moduleId, enrollmentId, answers);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`Quiz submitted. Score: ${res.score}%`);
      router.refresh();
      router.back();
    } catch {
      toast.error("Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {questions.map((q, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="text-base">{i + 1}. {q.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[i] >= 0 ? String(answers[i]) : ""}
                onValueChange={(v) => setAnswer(i, parseInt(v, 10))}
              >
                {q.options.map((opt, j) => (
                  <div key={j} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(j)} id={`q${i}-${j}`} />
                    <Label htmlFor={`q${i}-${j}`} className="font-normal cursor-pointer">{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}
        <Button type="submit" disabled={loading}>Submit quiz</Button>
      </div>
    </form>
  );
}
