"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export function AssignmentLink({
  assessmentId,
  enrollmentId,
  title,
}: {
  assessmentId: string;
  enrollmentId: string;
  title: string;
}) {
  return (
    <Link href={`/courses/assignment/${assessmentId}?enrollment=${enrollmentId}`}>
      <Button variant="outline">
        <Upload className="h-4 w-4 mr-2" />
        {title}
      </Button>
    </Link>
  );
}
