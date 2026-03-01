"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUserRole } from "@/app/actions/users";
import { toast } from "sonner";

interface UserRoleSelectProps {
  userId: string;
  currentRole: "admin" | "lecturer" | "student";
}

export function UserRoleSelect({ userId, currentRole }: UserRoleSelectProps) {
  const router = useRouter();
  const [role, setRole] = useState(currentRole);

  async function handleChange(newRole: string) {
    const typedRole = newRole as "admin" | "lecturer" | "student";
    setRole(typedRole);
    const res = await updateUserRole(userId, typedRole);
    if (res.error) {
      toast.error(res.error);
      setRole(currentRole);
    } else {
      toast.success("Role updated");
      router.refresh();
    }
  }

  return (
    <Select value={role} onValueChange={handleChange}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="student">Student</SelectItem>
        <SelectItem value="lecturer">Lecturer</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
      </SelectContent>
    </Select>
  );
}
