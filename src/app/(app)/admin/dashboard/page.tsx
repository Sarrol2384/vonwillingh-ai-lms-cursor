import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, ClipboardCheck, Sparkles } from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { count: pendingCount } = await supabase
    .from("enrollments")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending_approval");
  const { count: usersCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });
  const { count: coursesCount } = await supabase
    .from("courses")
    .select("*", { count: "exact", head: true });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, courses, and approvals.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending approvals</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingCount ?? 0}</p>
            <Link href="/admin/approvals">
              <Button variant="link" className="p-0 h-auto mt-1">View all</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{usersCount ?? 0}</p>
            <Link href="/admin/users">
              <Button variant="link" className="p-0 h-auto mt-1">Manage</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{coursesCount ?? 0}</p>
            <Link href="/admin/courses">
              <Button variant="link" className="p-0 h-auto mt-1">Manage</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">AI Generator</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link href="/admin/ai-generator">
              <Button size="sm">Generate course</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
