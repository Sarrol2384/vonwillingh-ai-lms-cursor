"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutDashboard, BookOpen, User, LogOut, Shield, GraduationCap, ClipboardList, Sparkles, Users } from "lucide-react";

interface AppNavProps {
  profile: Profile;
}

export function AppNav({ profile }: AppNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/courses", label: "My courses", icon: BookOpen },
    ...(profile.role === "lecturer"
      ? [
          { href: "/lecturer/dashboard", label: "Lecturer", icon: GraduationCap },
          { href: "/lecturer/grading", label: "Grading", icon: ClipboardList },
        ]
      : []),
    ...(profile.role === "admin"
      ? [
          { href: "/admin/dashboard", label: "Admin", icon: Shield },
          { href: "/admin/approvals", label: "Approvals", icon: ClipboardList },
          { href: "/admin/users", label: "Users", icon: Users },
          { href: "/admin/ai-generator", label: "AI Gen", icon: Sparkles },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/dashboard" className="font-semibold">
          VonWillingh LMS
        </Link>
        <nav className="flex items-center gap-2">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button
                variant={pathname.startsWith(link.href) ? "secondary" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Button>
            </Link>
          ))}
        </nav>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback>
                  {profile.full_name?.slice(0, 2).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{profile.full_name ?? "User"}</span>
                <span className="text-xs font-normal text-muted-foreground capitalize">
                  {profile.role}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            {profile.role === "student" && (
              <DropdownMenuItem asChild>
                <Link href="/register" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Register for course
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
