import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-3xl font-bold">VonWillingh AI LMS</h1>
        <p className="text-muted-foreground">
          Small university learning management system for testing. Sign in to access your dashboard.
        </p>
        <div className="flex gap-4 justify-center">
          {user ? (
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button>Sign in</Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
