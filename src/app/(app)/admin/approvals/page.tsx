import { createClient } from "@/lib/supabase/server";
import { ApproveRejectButtons } from "@/components/approve-reject-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminApprovalsPage() {
  const supabase = await createClient();
  const { data: pending } = await supabase
    .from("enrollments")
    .select("id, user_id, created_at, proof_of_payment_url, courses(title, code)")
    .eq("status", "pending_approval")
    .order("created_at", { ascending: false });

  const userIds = Array.from(new Set((pending ?? []).map((p: { user_id: string }) => p.user_id)));
  const { data: profiles } = userIds.length > 0
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((p: { id: string; full_name: string | null }) => [p.id, p.full_name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pending approvals</h1>
        <p className="text-muted-foreground">Approve or reject course registrations.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          {pending && pending.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead className="w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(pending as unknown as Array<{
                  id: string;
                  user_id: string;
                  created_at: string;
                  proof_of_payment_url: string | null;
                  courses: { title: string; code: string } | { title: string; code: string }[] | null;
                }>).map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{profileMap.get(e.user_id) ?? "—"}</TableCell>
                    <TableCell>{(Array.isArray(e.courses) ? e.courses[0]?.title : e.courses?.title) ?? "—"} ({(Array.isArray(e.courses) ? e.courses[0]?.code : e.courses?.code) ?? ""})</TableCell>
                    <TableCell>{new Date(e.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {e.proof_of_payment_url ? (
                        <a href={e.proof_of_payment_url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">
                          View
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <ApproveRejectButtons enrollmentId={e.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No pending approvals.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
