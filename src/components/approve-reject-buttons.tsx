"use client";

import { useRouter } from "next/navigation";
import { approveEnrollment, rejectEnrollment } from "@/app/actions/enrollments";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ApproveRejectButtons({ enrollmentId }: { enrollmentId: string }) {
  const router = useRouter();

  async function handleApprove() {
    const res = await approveEnrollment(enrollmentId);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Registration approved");
      router.refresh();
    }
  }

  async function handleReject() {
    const res = await rejectEnrollment(enrollmentId);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Registration rejected");
      router.refresh();
    }
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={handleApprove}>Approve</Button>
      <Button size="sm" variant="destructive" onClick={handleReject}>Reject</Button>
    </div>
  );
}
