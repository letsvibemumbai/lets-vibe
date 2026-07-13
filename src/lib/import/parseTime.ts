/**
 * Parse the owner's free-text "Time" column (e.g. "10 pm to 12", "8.30 pm to
 * 10.30", "11 to 6 pm", "1 Am to 3", "8.15 to 10.15") into stored 24-hour
 * "HH:mm" start/end times. Infers am/pm and prefers the slot whose duration
 * matches the sheet's "Hour" column and that falls in the operating window.
 * Pure — unit-tested. Ports the reconciliation parser used to backfill times.
 */

type Meridiem = "am" | "pm";

/** Expected minutes from the "Hour" column (their .3/.5 shorthand ⇒ 30 min). */
export function hintMinutes(hour?: number): number {
  if (hour == null || !Number.isFinite(hour)) return 0;
  const whole = Math.trunc(hour);
  const frac = Math.round((hour - whole) * 10); // 1.5 -> 5, 2.3 -> 3
  const mins = frac === 15 ? 15 : frac === 3 || frac === 5 ? 30 : 0;
  return whole * 60 + mins;
}

function parseToken(tok: string): { h: number; m: number; mer: Meridiem | null } {
  const t0 = tok.trim().toLowerCase();
  const mer: Meridiem | null = t0.includes("pm")
    ? "pm"
    : t0.includes("am")
      ? "am"
      : null;
  const t = t0.replace(/pm|am/g, "").trim();
  if (t.includes(".")) {
    const [a, bRaw = ""] = t.split(".");
    const h = parseInt(a.replace(/\D/g, "") || "0", 10);
    const bd = bRaw.replace(/\D/g, "");
    const m = bd ? parseInt(bd.padEnd(2, "0").slice(0, 2), 10) : 0;
    return { h, m, mer };
  }
  return { h: parseInt(t.replace(/\D/g, "") || "0", 10), m: 0, mer };
}

function to24(h: number, m: number, mer: Meridiem): number {
  const H = mer === "pm" ? (h % 12) + 12 : h % 12;
  return H * 60 + m;
}

function fmt(mins: number): string {
  const x = ((mins % 1440) + 1440) % 1440;
  return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`;
}

export function parseTimeRange(
  raw: string,
  hourHint?: number,
): { start: string; end: string } | null {
  if (!raw || !/\bto\b/i.test(raw)) return null;
  const parts = raw.split(/\bto\b/i);
  if (parts.length < 2) return null;
  const s = parseToken(parts[0]);
  const e = parseToken(parts[1]);
  if (!Number.isFinite(s.h) || !Number.isFinite(e.h)) return null;
  const optsS: Meridiem[] = s.mer ? [s.mer] : ["am", "pm"];
  const optsE: Meridiem[] = e.mer ? [e.mer] : ["am", "pm"];
  const hint = hintMinutes(hourHint);

  let best: { score: number; s: number; e: number } | null = null;
  for (const a of optsS) {
    for (const b of optsE) {
      const sm = to24(s.h, s.m, a);
      const em = to24(e.h, e.m, b);
      const dur = em > sm ? em - sm : em - sm + 1440;
      if (dur <= 0 || dur > 8 * 60) continue;
      let score = hint ? Math.abs(dur - hint) : 0;
      if (!(sm >= 8 * 60 && sm <= 23 * 60 + 30)) score += 200; // sensible start
      if (em < sm) score += 40; // crosses midnight
      if (!s.mer && a === "am") score += 8; // bias ambiguous to pm/evening
      if (!e.mer && b === "am") score += 4;
      if (best === null || score < best.score) best = { score, s: sm, e: em };
    }
  }
  if (!best) return null;
  return { start: fmt(best.s), end: fmt(best.e) };
}
