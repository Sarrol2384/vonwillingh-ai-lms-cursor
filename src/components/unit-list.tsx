"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, GripVertical } from "lucide-react";

interface UnitListProps {
  moduleId: string;
  units: { id: string; title: string; sequence_order: number }[];
}

export function UnitList({ moduleId, units: initialUnits }: UnitListProps) {
  const [units, setUnits] = useState(initialUnits);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function addUnit() {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("units")
        .insert({
          module_id: moduleId,
          title: title.trim(),
          content: content.trim() || null,
          video_url: videoUrl.trim() || null,
          sequence_order: units.length,
        })
        .select("id, title, sequence_order")
        .single();
      if (error) throw error;
      setUnits((u) => [...u, data]);
      setTitle("");
      setContent("");
      setVideoUrl("");
      setOpen(false);
      toast.success("Unit added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add unit
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New unit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Unit title" />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} placeholder="Rich text or markdown" />
            </div>
            <div className="space-y-2">
              <Label>Video URL</Label>
              <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." />
            </div>
            <Button onClick={addUnit} disabled={loading}>Add</Button>
          </div>
        </DialogContent>
      </Dialog>
      <ul className="space-y-2">
        {units.map((u) => (
          <li key={u.id} className="flex items-center gap-2 border rounded-md p-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">{u.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
