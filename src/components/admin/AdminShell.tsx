"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarPlus, Menu } from "lucide-react";
import { Sidebar } from "@/components/admin/Sidebar";
import { getPageTitle } from "@/components/admin/nav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TimeFormatToggle } from "@/components/time/TimeFormatToggle";

type Props = {
  username: string;
  children: React.ReactNode;
};

function todayString(): string {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function AdminShell({ username, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname() ?? "";
  const pageTitle = getPageTitle(pathname);

  return (
    <div className="admin-sf flex min-h-screen bg-background font-body text-foreground">
      <Sidebar
        username={username}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-3 border-b border-hairline bg-card/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground ring-1 ring-hairline-strong transition-colors hover:bg-accent hover:text-accent-foreground md:hidden"
            >
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <div className="flex min-w-0 flex-col">
              <h1
                className="truncate font-display text-2xl leading-none tracking-[-0.01em] text-foreground sm:text-3xl"
                style={{ fontWeight: 400 }}
              >
                {pageTitle}
              </h1>
              <div className="mt-1.5 flex items-center gap-3">
                <span className="h-px w-10 bg-accent/60" />
                <span className="hidden text-[12px] uppercase tracking-[0.22em] text-foreground/55 lg:inline">
                  {todayString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <TimeFormatToggle tone="admin" />
            <ThemeToggle tone="admin" />
            <Link
              href="/admin/bookings/new"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.14em] text-accent-foreground transition-transform hover:scale-[1.03]"
            >
              <CalendarPlus className="h-4 w-4" strokeWidth={2} />
              <span className="hidden sm:inline">New Booking</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
