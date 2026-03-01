import { getCurrentProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Update your personal details.</p>
      </div>
      <ProfileForm profile={profile} />
    </div>
  );
}
