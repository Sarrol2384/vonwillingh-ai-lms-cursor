"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AiGeneratorForm() {
  const router = useRouter();
  const [courseTitle, setCourseTitle] = useState("");
  const [nqfLevel, setNqfLevel] = useState("5");
  const [numModules, setNumModules] = useState("4");
  const [loading, setLoading] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!courseTitle.trim()) {
      toast.error("Enter a course title");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseTitle,
          nqfLevel: parseInt(nqfLevel, 10),
          numModules: parseInt(numModules, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Generation failed");
        return;
      }
      toast.success("Course generated! Redirecting to edit...");
      router.push(`/admin/courses/${data.courseId}`);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Generate course
        </CardTitle>
        <CardDescription>
          Claude will create course content, modules, and units. Requires{" "}
          <code>ANTHROPIC_API_KEY</code> in your environment.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleGenerate}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="courseTitle">Course title</Label>
            <Input
              id="courseTitle"
              placeholder="e.g. Introduction to Business Management"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>NQF level</Label>
              <Select value={nqfLevel} onValueChange={setNqfLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      NQF {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="numModules">Number of modules</Label>
              <Input
                id="numModules"
                type="number"
                min="2"
                max="10"
                value={numModules}
                onChange={(e) => setNumModules(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate with Claude
              </>
            )}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
