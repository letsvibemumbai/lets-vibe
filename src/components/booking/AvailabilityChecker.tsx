"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Minus, Plus, Search } from "lucide-react";
import { format } from "date-fns";
import { SectionLabel } from "@/components/editorial";
import {
  checkAvailabilityAction,
  type ScreenAvailability,
} from "@/app/actions/booking";
import type { Duration } from "@/types";
import { cn } from "@/lib/utils";

const OPEN_HOUR = 9;
const CLOSE_HOUR = 21;
const MIN_DURATION = 1;
const MAX_DURATION = 3;

function clampDuration(n: number): Duration {
  return Math.min(MAX_DURATION, Math.max(MIN_DURATION, n)) as Duration;
}

/** Valid 30-min start times for a duration, within 9:00–21:00. */
function startTimes(duration: number): string[] {
  const out: string[] = [];
  const last = (CLOSE_HOUR - duration) * 60;
  for (let m = OPEN_HOUR * 60; m <= last; m += 30) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    out.push(`${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
  }
  return out;
}

type Props = {
  /** "panel" = bordered card (booking page); "bare" = inline (homepage band). */
  variant?: "panel" | "bare";
  className?: string;
};

export function AvailabilityChecker({ variant = "panel", className }: Props) {
  const today = React.useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const [date, setDate] = React.useState(today);
  const [duration, setDuration] = React.useState<Duration>(2);
  const [time, setTime] = React.useState("18:00");
  const [results, setResults] = React.useState<ScreenAvailability[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const times = React.useMemo(() => startTimes(duration), [duration]);

  // Keep the selected time valid when duration changes.
  React.useEffect(() => {
    if (!times.includes(time)) setTime(times[times.length - 1] ?? "18:00");
  }, [times, time]);

  function onCheck() {
    setError(null);
    startTransition(async () => {
      try {
        const r = await checkAvailabilityAction(date, time, duration);
        setResults(r);
      } catch (e) {
        setResults(null);
        setError(
          e instanceof Error ? e.message : "Couldn't check availability. Try again.",
        );
      }
    });
  }

  const fieldCls =
    "h-11 w-full rounded-sm bg-cream-tonal/60 px-3 text-[14px] text-ink ring-1 ring-hairline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60";

  return (
    <div
      className={cn(
        variant === "panel" &&
          "rounded-sm border border-hairline bg-cream-tonal/30 p-5 sm:p-7",
        className,
      )}
    >
      <SectionLabel tone="accent" className="mb-4">
        Check availability
      </SectionLabel>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.2fr_1fr_auto_auto] sm:items-end">
        {/* Date */}
        <label className="block">
          <span className="mb-1.5 block text-[10px] uppercase tracking-[0.22em] text-muted">
            Date
          </span>
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            className={cn(fieldCls, "[color-scheme:dark]")}
          />
        </label>

        {/* Time */}
        <label className="block">
          <span className="mb-1.5 block text-[10px] uppercase tracking-[0.22em] text-muted">
            Start time
          </span>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={cn(fieldCls, "appearance-none")}
          >
            {times.map((t) => (
              <option key={t} value={t} className="bg-[#141419] text-ink">
                {t}
              </option>
            ))}
          </select>
        </label>

        {/* Duration stepper */}
        <div>
          <span className="mb-1.5 block text-[10px] uppercase tracking-[0.22em] text-muted">
            Hours
          </span>
          <div className="flex h-11 items-center gap-2">
            <button
              type="button"
              aria-label="Fewer hours"
              disabled={duration <= MIN_DURATION}
              onClick={() => setDuration((d) => clampDuration(d - 1))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-hairline-strong text-ink transition-colors hover:bg-ink hover:text-cream disabled:opacity-30 disabled:pointer-events-none"
            >
              <Minus className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
            <span className="w-5 text-center font-display text-xl tabular-nums text-ink">
              {duration}
            </span>
            <button
              type="button"
              aria-label="More hours"
              disabled={duration >= MAX_DURATION}
              onClick={() => setDuration((d) => clampDuration(d + 1))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-hairline-strong text-ink transition-colors hover:bg-ink hover:text-cream disabled:opacity-30 disabled:pointer-events-none"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={onCheck}
          disabled={pending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-6 text-xs font-semibold uppercase tracking-[0.18em] text-cream transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-3.5 w-3.5" strokeWidth={2} />
          )}
          Check
        </button>
      </div>

      {/* Results */}
      {error && (
        <p className="mt-5 text-[13px] text-ink/75">{error}</p>
      )}

      {results && !error && (
        <ul className="mt-6 divide-y divide-hairline border-t border-hairline">
          {results.map((r) => (
            <li
              key={r.screenId}
              className="flex items-center justify-between gap-4 py-4"
            >
              <div className="min-w-0">
                <p
                  className="font-display text-lg leading-tight text-ink"
                  style={{ fontWeight: 400 }}
                >
                  {r.name}
                </p>
                <p className="mt-0.5 text-[12px] text-muted">
                  {r.startTime}–{r.endTime} · from ₹
                  {r.startingPrice.toLocaleString("en-IN")}
                </p>
              </div>
              {r.available ? (
                <Link
                  href={`/book/${r.screenId}`}
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-ink px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-cream transition-transform hover:scale-[1.03]"
                >
                  Reserve
                </Link>
              ) : (
                <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
                  Booked
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
