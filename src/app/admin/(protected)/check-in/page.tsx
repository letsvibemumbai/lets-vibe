import Link from "next/link";
import { ChevronRight, ShieldAlert } from "lucide-react";
import { getBookingsByDate } from "@/lib/db/bookings.server";
import { istDateAndMinutes } from "@/lib/slots/engine";
import { checkInConfigured } from "@/lib/checkin/token";
import { QrScanner } from "@/components/admin/checkin/QrScanner";
import { SCREEN_LABEL } from "@/components/admin/dashboard/utils";
import { TimeRange } from "@/components/time/Time";
import { cn } from "@/lib/utils";
import type { Booking, CheckInStatus } from "@/types";

export const metadata = { title: "Check-in · Let's Vibe Admin" };
export const dynamic = "force-dynamic";

const ENTRY_PILL: Record<CheckInStatus, { label: string; cls: string }> = {
  admitted: { label: "Admitted", cls: "bg-emerald-500/15 text-emerald-300" },
  rejected: { label: "Rejected", cls: "bg-rose-500/15 text-rose-300" },
  awaiting: { label: "Awaiting", cls: "bg-white/10 text-foreground/55" },
};

export default async function CheckInScannerPage() {
  // Use IST "today" so this list agrees with the per-booking timing check
  // (evaluateCheckIn), regardless of the server's own timezone.
  const today = await getBookingsByDate(istDateAndMinutes(new Date()).date);
  const relevant = today
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="font-display text-4xl text-foreground">Check-in</h1>
        <p className="mt-1 text-sm text-foreground/55">
          Scan a guest&rsquo;s QR pass — or pick from today&rsquo;s bookings — to
          verify the slot and grant entry.
        </p>
      </header>

      {!checkInConfigured() && (
        <div className="flex items-start gap-2 rounded-2xl bg-accent/10 p-4 text-sm text-accent ring-1 ring-accent/30">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            QR signing isn&rsquo;t configured — set <code>CHECKIN_SECRET</code> so
            scanned passes verify. Entry still works via manual review.
          </p>
        </div>
      )}

      <QrScanner />

      <section className="rounded-3xl bg-card p-5 ring-1 ring-hairline">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground/70">
          Today&rsquo;s bookings
        </h2>
        {relevant.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-hairline-strong bg-background/40 px-4 py-6 text-center text-sm text-foreground/50">
            No confirmed bookings for today.
          </p>
        ) : (
          <ul className="divide-y divide-hairline">
            {relevant.map((b) => (
              <TodayRow key={b.id} booking={b} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function TodayRow({ booking }: { booking: Booking }) {
  const entry = ENTRY_PILL[booking.checkInStatus ?? "awaiting"] ?? ENTRY_PILL.awaiting;
  return (
    <li>
      <Link
        href={`/admin/check-in/${booking.id}`}
        className="flex items-center gap-3 py-3 transition-colors hover:text-foreground"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">
            {booking.customerName}
          </p>
          <p className="mt-0.5 text-xs text-foreground/55">
            <TimeRange start={booking.startTime} end={booking.endTime} /> ·{" "}
            {SCREEN_LABEL[booking.screenId]} · {booking.guestCount} guest
            {booking.guestCount === 1 ? "" : "s"}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
            entry.cls,
          )}
        >
          {entry.label}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-foreground/30" />
      </Link>
    </li>
  );
}
