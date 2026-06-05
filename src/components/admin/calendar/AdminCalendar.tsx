"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SCREEN_IDS } from "@/lib/booking/constants";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/admin/dashboard/StatusBadge";
import {
  SCREEN_LABEL,
  formatINR,
  summarizeAddOns,
} from "@/components/admin/dashboard/utils";
import type { Booking, ScreenId } from "@/types";

type Props = {
  initialMonth: string; // YYYY-MM
  today: string;
  bookings: Booking[];
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const SCREEN_CHIP: Record<ScreenId, string> = {
  beach: "bg-orange-100 text-orange-900 ring-orange-200",
  grass: "bg-emerald-100 text-emerald-900 ring-emerald-200",
  forest: "bg-teal-900 text-teal-50 ring-teal-800",
};

const SCREEN_DOT: Record<ScreenId, string> = {
  beach: "bg-orange-400",
  grass: "bg-emerald-500",
  forest: "bg-teal-700",
};

type Filter = "all" | ScreenId;

type SheetMode =
  | { kind: "none" }
  | { kind: "booking"; booking: Booking }
  | { kind: "day"; date: string };

export function AdminCalendar({ initialMonth, today, bookings }: Props) {
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const [y, m] = initialMonth.split("-").map(Number);
    return startOfMonth(new Date(y, (m ?? 1) - 1, 1));
  });
  const [filter, setFilter] = useState<Filter>("all");
  const [sheet, setSheet] = useState<SheetMode>({ kind: "none" });

  const todayDate = parseISO(today);

  const visibleBookings = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.status !== "cancelled" &&
          (filter === "all" || b.screenId === filter),
      ),
    [bookings, filter],
  );

  const byDate = useMemo(() => {
    const m = new Map<string, Booking[]>();
    for (const b of visibleBookings) {
      const arr = m.get(b.date) ?? [];
      arr.push(b);
      m.set(b.date, arr);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return m;
  }, [visibleBookings]);

  const monthStart = startOfMonth(viewMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = new Date(gridStart);
  gridEnd.setDate(gridEnd.getDate() + 41);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  function dayBookings(iso: string): Booking[] {
    return byDate.get(iso) ?? [];
  }

  function openDay(iso: string) {
    setSheet({ kind: "day", date: iso });
  }

  function openBooking(b: Booking) {
    setSheet({ kind: "booking", booking: b });
  }

  return (
    <div className="space-y-5">
      <Toolbar
        viewMonth={viewMonth}
        onPrev={() => setViewMonth((d) => addMonths(d, -1))}
        onNext={() => setViewMonth((d) => addMonths(d, 1))}
        onToday={() => setViewMonth(startOfMonth(todayDate))}
        filter={filter}
        onFilter={setFilter}
      />

      <div className="rounded-3xl bg-card p-4 ring-1 ring-hairline ">
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wider text-foreground/45">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1.5">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const iso = format(day, "yyyy-MM-dd");
            const inMonth = isSameMonth(day, viewMonth);
            const isToday = isSameDay(day, todayDate);
            const list = dayBookings(iso);
            return (
              <div
                key={iso}
                className={cn(
                  "flex min-h-28 flex-col gap-1 rounded-xl border p-1.5 text-left transition-colors",
                  inMonth
                    ? "border-hairline bg-card"
                    : "border-transparent bg-cream/30 text-foreground/40",
                  isToday && "ring-1 ring-brand-yellow/60",
                )}
              >
                <button
                  type="button"
                  onClick={() => openDay(iso)}
                  className="flex items-center justify-between gap-1 px-1 text-xs hover:text-foreground"
                >
                  <span
                    className={cn(
                      "font-semibold",
                      isToday && "text-foreground",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {list.length > 0 && (
                    <span className="rounded-full bg-foreground/5 px-1.5 py-0.5 text-[10px] text-foreground/60">
                      {list.length}
                    </span>
                  )}
                </button>
                <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                  {list.slice(0, 4).map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => openBooking(b)}
                      className={cn(
                        "truncate rounded-md px-1.5 py-0.5 text-left text-[10.5px] font-medium ring-1 ring-inset",
                        SCREEN_CHIP[b.screenId],
                      )}
                      title={`${b.startTime} ${b.customerName} · ${SCREEN_LABEL[b.screenId]}`}
                    >
                      {b.startTime} {b.customerName}
                    </button>
                  ))}
                  {list.length > 4 && (
                    <button
                      type="button"
                      onClick={() => openDay(iso)}
                      className="rounded-md px-1.5 py-0.5 text-left text-[10.5px] font-medium text-foreground/60 hover:bg-cream"
                    >
                      +{list.length - 4} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Sheet
        open={sheet.kind !== "none"}
        onOpenChange={(o) => !o && setSheet({ kind: "none" })}
      >
        <SheetContent side="right" className="w-full max-w-md p-0">
          {sheet.kind === "booking" && (
            <BookingDetailSheet booking={sheet.booking} />
          )}
          {sheet.kind === "day" && (
            <DayDetailSheet
              date={sheet.date}
              bookings={dayBookings(sheet.date)}
              onOpenBooking={openBooking}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Toolbar({
  viewMonth,
  onPrev,
  onNext,
  onToday,
  filter,
  onFilter,
}: {
  viewMonth: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  filter: Filter;
  onFilter: (f: Filter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-card p-3 ring-1 ring-hairline">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Previous month"
          onClick={onPrev}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-cream"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToday}
          className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm hover:bg-cream"
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Today
        </button>
        <button
          type="button"
          aria-label="Next month"
          onClick={onNext}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-cream"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <span className="ml-2 min-w-32 font-display text-xl text-foreground">
          {format(viewMonth, "MMMM yyyy")}
        </span>
      </div>

      <div className="flex items-center gap-1 rounded-full bg-cream/60 p-1">
        <FilterChip active={filter === "all"} onClick={() => onFilter("all")}>
          All
        </FilterChip>
        {SCREEN_IDS.map((id) => (
          <FilterChip
            key={id}
            active={filter === id}
            onClick={() => onFilter(id)}
          >
            <span className={cn("h-2 w-2 rounded-full", SCREEN_DOT[id])} />
            {SCREEN_LABEL[id]}
          </FilterChip>
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors",
        active
          ? "bg-foreground text-cream"
          : "text-foreground/65 hover:bg-card hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function BookingDetailSheet({ booking }: { booking: Booking }) {
  const addOns = summarizeAddOns(booking.addOns);
  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="border-b border-hairline px-5 pt-5">
        <SheetTitle className="font-display text-2xl">
          {booking.customerName}
        </SheetTitle>
        <SheetDescription>
          {SCREEN_LABEL[booking.screenId]} · {booking.date} ·{" "}
          {booking.startTime}–{booking.endTime}
        </SheetDescription>
      </SheetHeader>
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 text-sm">
        <div className="flex items-center gap-2">
          <StatusBadge status={booking.status} />
          <span className="text-xs text-foreground/55 capitalize">
            {booking.source}
          </span>
        </div>
        <DL label="Phone" value={booking.customerPhone} />
        {booking.customerEmail && (
          <DL label="Email" value={booking.customerEmail} />
        )}
        <DL label="Guests" value={booking.guestCount} />
        <DL label="Duration" value={`${booking.duration}h`} />
        <DL label="Amount" value={formatINR(booking.amount)} />
        {addOns && <DL label="Add-ons" value={addOns} />}
        {booking.notes && <DL label="Notes" value={booking.notes} />}
      </div>
      <div className="border-t border-hairline px-5 py-4">
        <Link
          href={`/admin/bookings/${booking.id}`}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-cream hover:bg-foreground/90"
        >
          Open full booking
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function DayDetailSheet({
  date,
  bookings,
  onOpenBooking,
}: {
  date: string;
  bookings: Booking[];
  onOpenBooking: (b: Booking) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="border-b border-hairline px-5 pt-5">
        <SheetTitle className="font-display text-2xl">
          {format(parseISO(date), "EEEE, d MMMM")}
        </SheetTitle>
        <SheetDescription>
          {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}
        </SheetDescription>
      </SheetHeader>
      <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
        {bookings.length === 0 ? (
          <p className="rounded-xl bg-cream/40 px-3 py-6 text-center text-sm text-foreground/55">
            No bookings on this date.
          </p>
        ) : (
          bookings.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => onOpenBooking(b)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left ring-1 ring-inset hover:brightness-95",
                SCREEN_CHIP[b.screenId],
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {b.startTime}–{b.endTime} · {b.customerName}
                </p>
                <p className="text-xs opacity-80">
                  {SCREEN_LABEL[b.screenId]} · {b.duration}h ·{" "}
                  {formatINR(b.amount)}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 opacity-70" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function DL({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-hairline py-1 last:border-0">
      <dt className="text-xs uppercase tracking-wider text-foreground/45">
        {label}
      </dt>
      <dd className="text-right text-foreground">{value}</dd>
    </div>
  );
}
