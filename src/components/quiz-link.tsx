"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";

export function QuizLink({
  assessmentId,
  enrollmentId,
  title,
}: {
  assessmentId: string;
  enrollmentId: string;
  title: string;
}) {
  return (
    <Link href={`/courses/quiz/${assessmentId}?enrollment=${enrollmentId}`}>
      <Button variant="outline">
        <ClipboardList className="h-4 w-4 mr-2" />
        {title}
      </Button>
    </Link>
  );
}
