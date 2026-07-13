/**
 * Time-of-day formatting shared across the app. Times are stored as 24-hour
 * "HH:mm" strings (e.g. "14:30"); operating hours are stored as integer hours.
 * The viewer's 12h/24h preference lives in a cookie and is applied at render
 * via the `<TimeText>` / `<TimeRange>` / `<HourText>` components.
 */

export type TimeFormat = "12" | "24";

export const DEFAULT_TIME_FORMAT: TimeFormat = "12";
export const TIME_FORMAT_COOKIE = "letsvibe.tf";

export function isTimeFormat(v: unknown): v is TimeFormat {
  return v === "12" || v === "24";
}

function parseHHMM(hhmm: string): { h: number; m: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm).trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 24 || m > 59) return null;
  return { h, m };
}

/** Format a stored "HH:mm" clock time. Unparseable input passes through. */
export function formatClock(
  hhmm: string,
  fmt: TimeFormat = DEFAULT_TIME_FORMAT,
): string {
  const p = parseHHMM(hhmm);
  if (!p) return hhmm;
  if (fmt === "24") {
    return `${String(p.h).padStart(2, "0")}:${String(p.m).padStart(2, "0")}`;
  }
  const period = p.h >= 12 && p.h < 24 ? "PM" : "AM";
  const h12 = p.h % 12 === 0 ? 12 : p.h % 12;
  return `${h12}:${String(p.m).padStart(2, "0")} ${period}`;
}

/** Format a start–end range, e.g. "2:30 PM – 4:30 PM" / "14:30 – 16:30". */
export function formatClockRange(
  start: string,
  end: string,
  fmt: TimeFormat = DEFAULT_TIME_FORMAT,
  sep = "–",
): string {
  return `${formatClock(start, fmt)} ${sep} ${formatClock(end, fmt)}`;
}

/** Format an integer operating hour (0–24), e.g. 9 → "9:00 AM" / "09:00". */
export function formatHour(
  hour: number,
  fmt: TimeFormat = DEFAULT_TIME_FORMAT,
): string {
  const h = Math.max(0, Math.min(24, Math.trunc(hour)));
  return formatClock(`${String(h).padStart(2, "0")}:00`, fmt);
}
