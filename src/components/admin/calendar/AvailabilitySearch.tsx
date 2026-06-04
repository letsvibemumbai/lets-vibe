"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarSearch, Loader2, Minus, Plus, Search } from "lucide-react";
import { format } from "date-fns";
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

function startTimes(duration: number): string[] {
  const out: string[] = [];
  const last = (CLOSE_HOUR - duration) * 60;
  for (let m = OPEN_HOUR * 60; m <= last; m += 30) {
    out.push(
      `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`,
    );
  }
  return out;
}

/** Admin tool: check which screens are free for a given date + start time +
 *  duration. Available screens deep-link to the offline booking form. */
export function AvailabilitySearch() {
  const today = React.useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const [date, setDate] = React.useState(today);
  const [duration, setDuration] = React.useState<Duration>(2);
  const [time, setTime] = React.useState("18:00");
  const [results, setResults] = React.useState<ScreenAvailability[] | null>(null);
  const [checkedFor, setCheckedFor] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const times = React.useMemo(() => startTimes(duration), [duration]);
  React.useEffect(() => {
    if (!times.includes(time)) setTime(times[times.length - 1] ?? "18:00");
  }, [times, time]);

  function check() {
    setError(null);
    startTransition(async () => {
      try {
        const r = await checkAvailabilityAction(date, time, duration);
        setResults(r);
        setCheckedFor(`${date} · ${time} · ${duration}h`);
      } catch (e) {
        setResults(null);
        setError(e instanceof Error ? e.message : "Couldn't check availability");
      }
    });
  }

  const field =
    "h-10 rounded-xl bg-background px-3 text-sm text-foreground ring-1 ring-white/12 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60";

  return (
    <section className="rounded-3xl bg-card p-4 ring-1 ring-white/10 sm:p-5">
      <header className="mb-4 flex items-center gap-2 text-foreground/70">
        <CalendarSearch className="h-4 w-4" />
        <h2 className="text-sm font-semibold uppercase tracking-wider">
          Check availability
        </h2>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-[0.18em] text-foreground/45">
            Day
          </span>
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            className={cn(field, "[color-scheme:dark]")}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-[0.18em] text-foreground/45">
            Start time
          </span>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={cn(field, "appearance-none pr-8")}
          >
            {times.map((t) => (
              <option key={t} value={t} className="bg-[#141419]">
                {t}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-[0.18em] text-foreground/45">
            Hours
          </span>
          <div className="flex h-10 items-center gap-2">
            <button
              type="button"
              aria-label="Fewer hours"
              disabled={duration <= MIN_DURATION}
              onClick={() => setDuration((d) => clampDuration(d - 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-foreground ring-1 ring-white/15 transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-30"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-5 text-center text-base tabular-nums text-foreground">
              {duration}
            </span>
            <button
              type="button"
              aria-label="More hours"
              disabled={duration >= MAX_DURATION}
              onClick={() => setDuration((d) => clampDuration(d + 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-foreground ring-1 ring-white/15 transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={check}
          disabled={pending}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition-transform hover:scale-[1.03] disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Check
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-foreground/70">{error}</p>}

      {results && !error && (
        <div className="mt-5">
          <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-foreground/45">
            {checkedFor}
          </p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {results.map((r) => (
              <li
                key={r.screenId}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3",
                  r.available
                    ? "border-emerald-500/30 bg-emerald-500/[0.08]"
                    : "border-white/10 bg-white/[0.03]",
                )}
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{r.name}</p>
                  <p className="text-[12px] text-foreground/55">
                    {r.startTime}–{r.endTime}
                  </p>
                </div>
                {r.available ? (
                  <Link
                    href="/admin/bookings/new"
                    className="shrink-0 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-300 transition-opacity hover:opacity-80"
                  >
                    Free · book
                  </Link>
                ) : (
                  <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground/55">
                    Unavailable
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
