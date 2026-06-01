"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Booking } from "@/types";
import { StatusBadge } from "./StatusBadge";
import {
  SCREEN_LABEL,
  formatINR,
  formatTimeRange,
} from "./utils";

type Props = {
  today: string; // YYYY-MM-DD
  bookings: Booking[]; // current-month bookings
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthCalendarCard({ today, bookings }: Props) {
  const todayDate = parseISO(today);
  const [viewMonth, setViewMonth] = useState<Date>(startOfMonth(todayDate));
  const [selected, setSelected] = useState<string>(today);

  const countsByDate = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of bookings) {
      if (b.status === "cancelled") continue;
      m.set(b.date, (m.get(b.date) ?? 0) + 1);
    }
    return m;
  }, [bookings]);

  // Grid: pad from Monday of first week to Sunday of last week.
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = startOfWeek(monthEnd, { weekStartsOn: 1 });
  // Always show 6 rows for stable layout
  gridEnd.setDate(gridEnd.getDate() + 6 * 7 - 1);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd }).slice(
    0,
    42,
  );

  const selectedDate = parseISO(selected);
  const selectedBookings = bookings
    .filter((b) => b.date === selected && b.status !== "cancelled")
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <section className="rounded-3xl bg-card p-6 ring-1 ring-white/10 ">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-foreground/70" />
          <h2 className="font-display text-2xl">Upcoming this month</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setViewMonth((m) => addMonths(m, -1))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-foreground/60 hover:bg-cream hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-28 text-center text-sm font-medium text-foreground">
            {format(viewMonth, "MMMM yyyy")}
          </span>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setViewMonth((m) => addMonths(m, 1))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-foreground/60 hover:bg-cream hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="mt-5 grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wider text-foreground/45">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1.5">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const iso = format(day, "yyyy-MM-dd");
          const count = countsByDate.get(iso) ?? 0;
          const inMonth = isSameMonth(day, viewMonth);
          const isToday = isSameDay(day, todayDate);
          const isSelected = iso === selected;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => setSelected(iso)}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-colors",
                inMonth ? "text-foreground" : "text-foreground/30",
                isSelected
                  ? "bg-foreground text-cream"
                  : isToday
                    ? "bg-accent/20 ring-1 ring-accent/50"
                    : "hover:bg-white/5",
              )}
            >
              <span>{format(day, "d")}</span>
              {count > 0 && (
                <span
                  className={cn(
                    "absolute bottom-1 inline-flex h-1.5 min-w-[6px] items-center justify-center rounded-full px-1 text-[9px] font-semibold",
                    isSelected
                      ? "bg-cream text-foreground"
                      : "bg-accent text-accent-foreground",
                  )}
                  aria-label={`${count} bookings`}
                >
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-5 border-t border-white/10 pt-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            {isSameDay(selectedDate, todayDate)
              ? "Today"
              : format(selectedDate, "EEE, d MMM")}
          </h3>
          <p className="text-xs text-foreground/55">
            {selectedBookings.length}{" "}
            {selectedBookings.length === 1 ? "booking" : "bookings"}
          </p>
        </div>
        {selectedBookings.length === 0 ? (
          <p className="mt-3 rounded-xl bg-cream/40 px-3 py-4 text-center text-sm text-foreground/50">
            No bookings on this date.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {selectedBookings.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-cream/60 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {formatTimeRange(b.startTime, b.endTime)}
                    <span className="ml-2 text-xs text-foreground/55">
                      {SCREEN_LABEL[b.screenId]}
                    </span>
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-foreground/60">
                    <span className="truncate">{b.customerName}</span>
                    <Phone className="ml-1 h-3 w-3 shrink-0" />
                    <span>{b.customerPhone}</span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusBadge status={b.status} />
                  <p className="text-xs font-semibold text-foreground">
                    {formatINR(b.amount)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
