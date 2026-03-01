import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserRoleSelect } from "@/components/user-role-select";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at, id_number, phone")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage user roles.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ID Number</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(profiles ?? []).map((p: {
                id: string;
                full_name: string | null;
                role: string;
                created_at: string;
                id_number: string | null;
                phone: string | null;
              }) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.full_name ?? "—"}</TableCell>
                  <TableCell>{p.id_number ?? "—"}</TableCell>
                  <TableCell>{p.phone ?? "—"}</TableCell>
                  <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <UserRoleSelect userId={p.id} currentRole={p.role as "admin" | "lecturer" | "student"} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
