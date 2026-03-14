"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface RegistrationFormProps {
  profile: Profile;
  courses: { id: string; title: string; code: string }[];
}

export function RegistrationForm({ profile, courses }: RegistrationFormProps) {
  const [courseId, setCourseId] = useState("");
  const [idNumber, setIdNumber] = useState(profile.id_number ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId) {
      toast.error("Select a course");
      return;
    }
    if (!file) {
      toast.error("Upload proof of payment");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      // Save application details (phone, ID number) to profile so admins can see them
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          id_number: idNumber.trim() || null,
          phone: phone.trim() || null,
        })
        .eq("id", profile.id);
      if (profileError) {
        toast.error(profileError.message);
        setLoading(false);
        return;
      }
      const ext = file.name.split(".").pop() ?? "pdf";
      const path = `proofs/${profile.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("payments")
        .upload(path, file, { upsert: false });
      if (uploadError) {
        toast.error(uploadError.message);
        setLoading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("payments").getPublicUrl(path);
      const { error: insertError } = await supabase.from("enrollments").insert({
        user_id: profile.id,
        course_id: courseId,
        status: "pending_approval",
        proof_of_payment_url: urlData.publicUrl,
      });
      if (insertError) {
        if (insertError.code === "23505") {
          toast.error("You are already registered for this course.");
        } else {
          toast.error(insertError.message);
        }
        setLoading(false);
        return;
      }
      toast.success("Registration submitted. Wait for admin approval.");
      setCourseId("");
      setFile(null);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Course registration</CardTitle>
        <CardDescription>Name and email from your profile will be used.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Course</Label>
            <Select value={courseId} onValueChange={setCourseId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="id_number">ID number</Label>
            <Input
              id="id_number"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="South African ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+27 ..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proof">Proof of payment (PDF or image)</Label>
            <Input
              id="proof"
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit registration"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
