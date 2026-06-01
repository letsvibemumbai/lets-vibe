"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Minus, Plus } from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { NumberTicker } from "@/components/ui/number-ticker";
import { SectionLabel } from "@/components/editorial";
import { useBookingStore } from "@/lib/booking/store";
import { calculateBookingPrice } from "@/lib/slots/pricing";
import { getAllSlotsAction } from "@/app/actions/booking";
import type { Availability, Slot } from "@/lib/slots/engine";
import type { Duration, Screen } from "@/types";
import { cn } from "@/lib/utils";

const MIN_DURATION = 1;
const MAX_DURATION = 3;

function clampDuration(n: number): Duration {
  return Math.min(MAX_DURATION, Math.max(MIN_DURATION, n)) as Duration;
}

type Props = { screen: Screen };

function prettyTime(hhmm: string): string {
  const [h, m] = hhmm.split(":");
  const hour = String(parseInt(h, 10)).padStart(2, "0");
  return `${hour}:${m}`;
}

function slotLabel(slot: Slot): string {
  return `${prettyTime(slot.startTime)} – ${prettyTime(slot.endTime)}`;
}

export function DateSlotPicker({ screen }: Props) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const storeDate = useBookingStore((s) => s.date);
  const storeDuration = useBookingStore((s) => s.duration);
  const setScreen = useBookingStore((s) => s.setScreen);
  const setSlot = useBookingStore((s) => s.setSlot);
  const setAmount = useBookingStore((s) => s.setAmount);

  const [date, setDate] = useState<Date>(() =>
    storeDate ? new Date(`${storeDate}T00:00:00`) : today,
  );
  const [duration, setDuration] = useState<Duration>(storeDuration ?? 2);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setScreen(screen.id);
  }, [screen.id, setScreen]);

  const dateString = useMemo(() => format(date, "yyyy-MM-dd"), [date]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    startTransition(async () => {
      try {
        const result = await getAllSlotsAction(screen.id, dateString);
        if (!cancelled) setAvailability(result);
      } catch (e) {
        if (!cancelled) {
          setAvailability(null);
          setError(
            e instanceof Error ? e.message : "Couldn't load slots. Try again.",
          );
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [screen.id, dateString]);

  const price = calculateBookingPrice(screen, duration, {});
  const monthLabel = format(date, "MMMM yyyy");

  function persistSlot(slot: Slot) {
    setSlot(dateString, duration, slot.startTime, slot.endTime);
    setAmount(calculateBookingPrice(screen, duration, {}));
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
      {/* Calendar column */}
      <div>
        <div className="flex items-end justify-between border-b border-hairline pb-4">
          <SectionLabel>Choose a date</SectionLabel>
          <p
            className="font-display text-2xl leading-none text-ink"
            style={{ fontWeight: 400 }}
          >
            {monthLabel}
          </p>
        </div>
        <div className="mt-6">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && setDate(d)}
            disabled={(d) => isBefore(startOfDay(d), today)}
            className="rounded-sm"
          />
        </div>
      </div>

      {/* Duration + slots column */}
      <div className="flex flex-col gap-8">
        <div>
          <div className="flex items-end justify-between border-b border-hairline pb-4">
            <SectionLabel>Duration</SectionLabel>
            <p className="text-[13px] text-muted">
              ₹
              <NumberTicker
                key={`${screen.id}-${duration}`}
                value={price}
                className="text-ink"
              />
              <span className="ml-1">total</span>
            </p>
          </div>

          {/* Add-an-hour stepper: start at 1 hour, add up to 3. */}
          <div className="mt-6 flex items-center justify-between gap-4">
            <div>
              <p
                className="font-display leading-none tracking-[-0.01em] text-ink"
                style={{ fontWeight: 400 }}
              >
                <span className="text-5xl">0{duration}</span>
                <span className="ml-2 text-base text-muted">
                  hour{duration > 1 ? "s" : ""}
                </span>
              </p>
              <p className="mt-2 text-[12px] text-muted">
                Add an hour — up to {MAX_DURATION}.
              </p>
            </div>

            <div
              className="flex items-center gap-3"
              role="group"
              aria-label="Adjust duration in hours"
            >
              <button
                type="button"
                aria-label="Remove an hour"
                disabled={duration <= MIN_DURATION}
                onClick={() => setDuration((d) => clampDuration(d - 1))}
                className={cn(
                  "inline-flex h-12 w-12 items-center justify-center rounded-full ring-1 ring-hairline-strong text-ink transition-colors",
                  "hover:bg-ink hover:text-cream hover:ring-ink",
                  "disabled:opacity-30 disabled:pointer-events-none",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
                )}
              >
                <Minus className="h-4 w-4" strokeWidth={1.75} />
              </button>
              <span
                aria-live="polite"
                className="w-6 text-center font-display text-2xl tabular-nums text-ink"
                style={{ fontWeight: 400 }}
              >
                {duration}
              </span>
              <button
                type="button"
                aria-label="Add an hour"
                disabled={duration >= MAX_DURATION}
                onClick={() => setDuration((d) => clampDuration(d + 1))}
                className={cn(
                  "inline-flex h-12 w-12 items-center justify-center rounded-full ring-1 ring-hairline-strong text-ink transition-colors",
                  "hover:bg-ink hover:text-cream hover:ring-ink",
                  "disabled:opacity-30 disabled:pointer-events-none",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
                )}
              >
                <Plus className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-end justify-between border-b border-hairline pb-4">
            <SectionLabel>Available slots</SectionLabel>
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
              Asia / Kolkata
            </p>
          </div>
          <div className="mt-5">
            <SlotGrid
              pending={pending}
              error={error}
              slots={availability ? availability[`${duration}h`] : null}
              screenId={screen.id}
              onPersist={persistSlot}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SlotGrid({
  pending,
  error,
  slots,
  screenId,
  onPersist,
}: {
  pending: boolean;
  error: string | null;
  slots: Slot[] | null;
  screenId: string;
  onPersist: (slot: Slot) => void;
}) {
  if (pending && !slots) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-sm" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-sm border border-hairline-strong bg-cream-tonal px-4 py-6 text-center text-[13px] text-ink/75">
        {error}
      </div>
    );
  }
  if (!slots || slots.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-hairline-strong bg-cream-tonal/40 px-6 py-10 text-center">
        <p className="text-[14px] font-medium text-ink">
          No slots for this option
        </p>
        <p className="mt-2 text-[13px] text-muted">
          Try a different duration, or pick another date.
        </p>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2 sm:grid-cols-3",
        pending && "opacity-60",
      )}
    >
      {slots.map((slot) => (
        <Link
          key={`${slot.startTime}-${slot.durationHours}`}
          href={`/book/${screenId}/auth`}
          onClick={() => onPersist(slot)}
          className={cn(
            "group flex h-12 items-center justify-center rounded-sm bg-cream-tonal/60 px-2 font-mono text-[13px] tabular-nums tracking-tight text-ink ring-1 ring-hairline",
            "transition-colors duration-200 hover:bg-ink hover:text-cream hover:ring-ink",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/50",
          )}
        >
          {slotLabel(slot)}
        </Link>
      ))}
      {pending && (
        <div className="col-span-full flex items-center justify-center text-[11px] uppercase tracking-[0.22em] text-muted">
          <Loader2 className="mr-2 h-3 w-3 animate-spin" /> updating
        </div>
      )}
    </div>
  );
}
