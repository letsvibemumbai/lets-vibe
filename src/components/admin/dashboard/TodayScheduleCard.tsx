import { Calendar, Phone, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { SCREEN_IDS } from "@/lib/booking/constants";
import type { Booking, ScreenId } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { MarkCompletedButton } from "./MarkCompletedButton";
import {
  SCREEN_LABEL,
  STATUS_STYLES,
  formatINR,
  summarizeAddOns,
} from "./utils";
import { TimeRange } from "@/components/time/Time";

type Props = {
  bookings: Booking[];
};

export function TodayScheduleCard({ bookings }: Props) {
  const visible = bookings.filter((b) => b.status !== "cancelled");
  const byScreen = new Map<ScreenId, Booking[]>(
    SCREEN_IDS.map((id) => [id, []]),
  );
  for (const b of visible) byScreen.get(b.screenId)?.push(b);

  const hasBookings = visible.length > 0;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border border-hairline-strong p-6",
        hasBookings ? "bg-accent/[0.06]" : "bg-card",
      )}
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Calendar className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h2
              className="font-display text-2xl leading-none tracking-[-0.01em] text-foreground"
              style={{ fontWeight: 400 }}
            >
              Today
            </h2>
            <p className="mt-1 text-[13px] leading-none text-foreground/60">
              What&apos;s happening right now
            </p>
          </div>
        </div>
        <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          {visible.length} {visible.length === 1 ? "booking" : "bookings"}
        </span>
      </header>

      {!hasBookings ? (
        <p className="mt-6 rounded-2xl border border-dashed border-hairline bg-card px-6 py-10 text-center text-2xl text-foreground/55">
          nothing today. enjoy the quiet.
        </p>
      ) : (
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {SCREEN_IDS.map((id) => (
            <ScreenColumn
              key={id}
              screenId={id}
              bookings={byScreen.get(id) ?? []}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ScreenColumn({
  screenId,
  bookings,
}: {
  screenId: ScreenId;
  bookings: Booking[];
}) {
  return (
    <div>
      <h3 className="mb-3 text-xl leading-none text-accent">
        {SCREEN_LABEL[screenId]}
      </h3>
      <div className="space-y-2">
        {bookings.length === 0 ? (
          <p className="rounded-xl border-2 border-dashed border-hairline bg-card px-3 py-3 text-center text-xs text-foreground/45">
            no bookings
          </p>
        ) : (
          bookings.map((b) => <BookingRow key={b.id} booking={b} />)
        )}
      </div>
    </div>
  );
}

function BookingRow({ booking }: { booking: Booking }) {
  const s = STATUS_STYLES[booking.status];
  const addOns = summarizeAddOns(booking.addOns);
  return (
    <div
      className={cn(
        "rounded-xl border-2 bg-card p-3 transition-colors",
        s.border,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-sm uppercase text-foreground">
            <TimeRange start={booking.startTime} end={booking.endTime} />
            <span className="ml-2 font-body text-xs font-semibold text-foreground/50">
              {booking.duration}h
            </span>
          </p>
          <p className="mt-1 flex items-center gap-1 text-sm font-medium text-foreground/80">
            <User className="h-3.5 w-3.5 shrink-0 text-foreground/50" />
            <span className="truncate">{booking.customerName}</span>
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-foreground/55">
            <Phone className="h-3 w-3 shrink-0" />
            {booking.customerPhone}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-accent">
          {formatINR(booking.amount)}
        </p>
        {booking.status === "confirmed" && (
          <MarkCompletedButton bookingId={booking.id} />
        )}
      </div>
      {addOns && (
        <p className="mt-1.5 truncate text-xs text-foreground/50">{addOns}</p>
      )}
    </div>
  );
}
