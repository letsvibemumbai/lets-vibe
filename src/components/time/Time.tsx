"use client";

import { formatClock, formatClockRange, formatHour } from "@/lib/time";
import { useTimeFormat } from "./TimeFormatProvider";

/** A single stored "HH:mm" time, rendered in the viewer's 12h/24h preference. */
export function TimeText({ value }: { value: string }) {
  const { format } = useTimeFormat();
  return <>{formatClock(value, format)}</>;
}

/** A start–end time range (e.g. "2:30 PM – 4:30 PM"). */
export function TimeRange({
  start,
  end,
  sep = "–",
}: {
  start: string;
  end: string;
  sep?: string;
}) {
  const { format } = useTimeFormat();
  return <>{formatClockRange(start, end, format, sep)}</>;
}

/** An integer operating hour (0–24), e.g. 9 → "9:00 AM" / "09:00". */
export function HourText({ value }: { value: number }) {
  const { format } = useTimeFormat();
  return <>{formatHour(value, format)}</>;
}
