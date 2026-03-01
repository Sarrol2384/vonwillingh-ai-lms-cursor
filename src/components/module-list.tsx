"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus, GripVertical } from "lucide-react";

interface ModuleListProps {
  courseId: string;
  modules: { id: string; title: string; sequence_order: number }[];
}

export function ModuleList({ courseId, modules: initialModules }: ModuleListProps) {
  const [modules, setModules] = useState(initialModules);
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [loading, setLoading] = useState(false);

  async function addModule() {
    if (!newTitle.trim()) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("modules")
        .insert({
          course_id: courseId,
          title: newTitle.trim(),
          description: newDesc.trim() || null,
          sequence_order: modules.length,
        })
        .select("id, title, sequence_order")
        .single();
      if (error) throw error;
      setModules((m) => [...m, data]);
      setNewTitle("");
      setNewDesc("");
      setOpen(false);
      toast.success("Module added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add module
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New module</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Module title" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={2} />
              </div>
              <Button onClick={addModule} disabled={loading}>Add</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <ul className="space-y-2">
        {modules.map((m) => (
          <li key={m.id} className="flex items-center gap-2 border rounded-md p-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">{m.title}</span>
            <Link href={`/admin/courses/${courseId}/modules/${m.id}`}>
              <Button variant="outline" size="sm">Edit / Units</Button>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
