"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Eye, ChevronDown, ChevronRight, BookOpen, FileText, HelpCircle, Loader2 } from "lucide-react";

interface Unit {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  sequence_order: number;
}

interface Assessment {
  id: string;
  type: string;
  title: string;
  config: {
    questions?: { question: string; options: string[]; correctIndex: number }[];
    instructions?: string;
    max_score?: number;
  };
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  sequence_order: number;
  units: Unit[];
  assessments: Assessment[];
}

interface CoursePreviewModalProps {
  courseId: string;
  courseTitle: string;
  courseCode: string;
}

export function CoursePreviewModal({ courseId, courseTitle, courseCode }: CoursePreviewModalProps) {
  const [open, setOpen] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<Record<string, "content" | "quiz" | "assignment">>({});

  async function loadPreview() {
    if (modules.length > 0) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: mods } = await supabase
        .from("modules")
        .select("id, title, description, sequence_order")
        .eq("course_id", courseId)
        .order("sequence_order");

      if (!mods) return;

      const full: Module[] = await Promise.all(
        mods.map(async (mod) => {
          const { data: units } = await supabase
            .from("units")
            .select("id, title, content, video_url, sequence_order")
            .eq("module_id", mod.id)
            .order("sequence_order");
          const { data: assessments } = await supabase
            .from("assessments")
            .select("id, type, title, config")
            .eq("module_id", mod.id);
          return {
            ...mod,
            units: units ?? [],
            assessments: (assessments ?? []) as Assessment[],
          };
        })
      );
      setModules(full);
      if (full.length > 0) setExpandedModule(full[0].id);
    } finally {
      setLoading(false);
    }
  }

  function toggleModule(id: string) {
    setExpandedModule((prev) => (prev === id ? null : id));
    setExpandedUnit(null);
  }

  function toggleUnit(id: string) {
    setExpandedUnit((prev) => (prev === id ? null : id));
  }

  function getTab(moduleId: string) {
    return previewTab[moduleId] ?? "content";
  }

  function setTab(moduleId: string, tab: "content" | "quiz" | "assignment") {
    setPreviewTab((prev) => ({ ...prev, [moduleId]: tab }));
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) loadPreview(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Preview as student
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Student preview — {courseTitle}
            <Badge variant="secondary">{courseCode}</Badge>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : modules.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">No modules yet.</p>
        ) : (
          <div className="space-y-3 mt-2">
            <p className="text-sm text-muted-foreground border-b pb-2">
              Viewing as an enrolled student. Modules are unlocked sequentially after passing each assessment.
            </p>
            {modules.map((mod, idx) => {
              const isExpanded = expandedModule === mod.id;
              const quiz = mod.assessments.find((a) => a.type === "quiz");
              const assignment = mod.assessments.find((a) => a.type === "assignment");
              const tab = getTab(mod.id);

              return (
                <div key={mod.id} className="border rounded-lg overflow-hidden">
                  {/* Module header */}
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-semibold">{mod.title}</p>
                        {mod.description && (
                          <p className="text-sm text-muted-foreground">{mod.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {mod.units.length} unit{mod.units.length !== 1 ? "s" : ""}
                      </Badge>
                      {quiz && <Badge variant="outline" className="text-xs">Quiz</Badge>}
                      {assignment && <Badge variant="outline" className="text-xs">Assignment</Badge>}
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </button>

                  {/* Module content */}
                  {isExpanded && (
                    <div className="border-t">
                      {/* Tab bar */}
                      <div className="flex border-b bg-muted/30">
                        <button
                          onClick={() => setTab(mod.id, "content")}
                          className={`px-4 py-2 text-sm font-medium flex items-center gap-1 border-b-2 transition-colors ${tab === "content" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          Units ({mod.units.length})
                        </button>
                        {quiz && (
                          <button
                            onClick={() => setTab(mod.id, "quiz")}
                            className={`px-4 py-2 text-sm font-medium flex items-center gap-1 border-b-2 transition-colors ${tab === "quiz" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                            Quiz ({quiz.config.questions?.length ?? 0} questions)
                          </button>
                        )}
                        {assignment && (
                          <button
                            onClick={() => setTab(mod.id, "assignment")}
                            className={`px-4 py-2 text-sm font-medium flex items-center gap-1 border-b-2 transition-colors ${tab === "assignment" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Assignment
                          </button>
                        )}
                      </div>

                      {/* Units tab */}
                      {tab === "content" && (
                        <div className="p-4 space-y-2">
                          {mod.units.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No units yet.</p>
                          ) : (
                            mod.units.map((unit) => (
                              <div key={unit.id} className="border rounded-md overflow-hidden">
                                <button
                                  onClick={() => toggleUnit(unit.id)}
                                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 text-left"
                                >
                                  <span className="font-medium text-sm">{unit.title}</span>
                                  {expandedUnit === unit.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </button>
                                {expandedUnit === unit.id && (
                                  <div className="px-4 pb-4 space-y-3 border-t bg-muted/10">
                                    {unit.content && (
                                      <p className="text-sm mt-3 whitespace-pre-wrap leading-relaxed">{unit.content}</p>
                                    )}
                                    {unit.video_url && (
                                      <a
                                        href={unit.video_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-sm text-primary underline"
                                      >
                                        Watch video / Search YouTube
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {/* Quiz tab */}
                      {tab === "quiz" && quiz && (
                        <div className="p-4 space-y-4">
                          <p className="text-sm text-muted-foreground">Pass mark: 50%. Students see one question at a time.</p>
                          {(quiz.config.questions ?? []).map((q, qi) => (
                            <div key={qi} className="border rounded-md p-3 space-y-2">
                              <p className="font-medium text-sm">{qi + 1}. {q.question}</p>
                              <ul className="space-y-1">
                                {q.options.map((opt, oi) => (
                                  <li
                                    key={oi}
                                    className={`text-sm px-3 py-1.5 rounded ${oi === q.correctIndex ? "bg-green-100 dark:bg-green-900/30 font-medium text-green-700 dark:text-green-400" : "text-muted-foreground"}`}
                                  >
                                    {String.fromCharCode(65 + oi)}. {opt}
                                    {oi === q.correctIndex && " ✓"}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Assignment tab */}
                      {tab === "assignment" && assignment && (
                        <div className="p-4 space-y-3">
                          <div className="border rounded-md p-4 space-y-2">
                            <p className="font-medium">{assignment.title}</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {assignment.config.instructions ?? "No instructions provided."}
                            </p>
                            <p className="text-xs text-muted-foreground">Max score: {assignment.config.max_score ?? 100}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">Students upload a PDF or document file. Graded manually by lecturer.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
