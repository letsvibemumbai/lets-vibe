"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, matchesNav } from "./nav";

type Props = {
  username: string;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
};

export function Sidebar({ username, mobileOpen, onMobileOpenChange }: Props) {
  return (
    <>
      <DesktopSidebar username={username} />
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent
          side="left"
          className="w-72 border-r border-hairline-strong bg-background p-0"
        >
          <SheetHeader className="border-b border-hairline-strong px-5 pb-4 pt-5">
            <SheetTitle asChild>
              <Logo href="/admin" imgClassName="h-10 w-auto" />
            </SheetTitle>
          </SheetHeader>
          <SidebarBody username={username} onNavigate={() => onMobileOpenChange(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}

function DesktopSidebar({ username }: { username: string }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-hairline-strong bg-background md:flex">
      <div className="border-b border-hairline-strong px-5 py-5">
        <Logo href="/admin" imgClassName="h-10 w-auto" />
        <p className="mt-2 text-xl leading-none text-accent">
          admin
        </p>
      </div>
      <SidebarBody username={username} />
    </aside>
  );
}

function SidebarBody({
  username,
  onNavigate,
}: {
  username: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("/api/admin/session/logout", { method: "DELETE" });
    } catch {
      // best-effort; still navigate away
    }
    router.replace("/admin/login");
  }

  return (
    <div className="flex flex-1 flex-col px-3 pb-5 pt-4">
      <nav className="flex-1">
        <ul className="space-y-1.5">
          {ADMIN_NAV.map((item) => {
            const active = matchesNav(pathname, item);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all",
                    active
                      ? "border-transparent bg-accent text-accent-foreground"
                      : "border-transparent text-foreground/70 hover:border-hairline-strong hover:bg-card hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.5} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-4 border-t border-hairline-strong pt-4">
        <div className="px-2 pb-3">
          <p className="text-base leading-none text-accent">signed in</p>
          <p className="mt-1 truncate text-sm font-semibold text-foreground">{username}</p>
        </div>
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-semibold text-foreground/70 transition-all hover:border-hairline-strong hover:bg-card hover:text-foreground disabled:opacity-60"
        >
          {signingOut ? <X className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}
