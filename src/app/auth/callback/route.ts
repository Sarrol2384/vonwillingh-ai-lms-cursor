import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // `next` param reserved for future redirect chaining
  searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        const role = profile?.role ?? "student";
        const redirect =
          role === "admin"
            ? "/admin/dashboard"
            : role === "lecturer"
              ? "/lecturer/dashboard"
              : "/dashboard";
        return NextResponse.redirect(`${origin}${redirect}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
