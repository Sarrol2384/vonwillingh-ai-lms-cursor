import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";

export default async function AdminCoursesPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, code, nqf_level, credits, created_at")
    .order("title");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Courses</h1>
          <p className="text-muted-foreground">Manage all courses.</p>
        </div>
        <Link href="/admin/courses/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New course
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All courses</CardTitle>
        </CardHeader>
        <CardContent>
          {courses && courses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>NQF</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((c: { id: string; title: string; code: string; nqf_level: number | null; credits: number | null }) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.code}</TableCell>
                    <TableCell>{c.title}</TableCell>
                    <TableCell>{c.nqf_level ?? "—"}</TableCell>
                    <TableCell>{c.credits ?? "—"}</TableCell>
                    <TableCell>
                      <Link href={`/admin/courses/${c.id}`}>
                        <Button variant="outline" size="sm">Edit</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No courses yet. Create one or use the AI generator.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
