import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { AppNav } from "@/components/app-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav profile={profile} />
      <main className="flex-1 container mx-auto p-4 md:p-6">{children}</main>
    </div>
  );
}
