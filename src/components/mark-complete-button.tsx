"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";

export function MarkCompleteButton({
  enrollmentId,
  unitId,
  completed,
}: {
  enrollmentId: string;
  unitId: string;
  completed: boolean;
}) {
  const router = useRouter();

  async function toggle() {
    const supabase = createClient();
    if (completed) {
      await supabase.from("unit_completions").delete().eq("enrollment_id", enrollmentId).eq("unit_id", unitId);
      toast.success("Marked incomplete");
    } else {
      await supabase.from("unit_completions").insert({ enrollment_id: enrollmentId, unit_id: unitId });
      toast.success("Marked complete");
    }
    router.refresh();
  }

  return (
    <Button variant={completed ? "secondary" : "outline"} size="sm" onClick={toggle}>
      {completed ? <><CheckCircle className="h-4 w-4 mr-1" /> Complete</> : "Mark complete"}
    </Button>
  );
}
