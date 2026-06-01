import type { Booking, Duration, Screen } from "@/types";

export type Slot = {
  startTime: string;
  endTime: string;
  durationHours: number;
};

export type Availability = {
  "1h": Slot[];
  "2h": Slot[];
  "3h": Slot[];
};

const SLOT_STEP_MIN = 30;

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  return Number(h) * 60 + Number(m);
}

export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function istDateAndMinutes(d: Date): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const hh = get("hour") === "24" ? "00" : get("hour");
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(hh) * 60 + Number(get("minute")),
  };
}

export function isDateBlocked(screen: Screen, date: string): boolean {
  return !!screen.blockedDates?.includes(date);
}

export function generateCandidateSlots(
  screen: Screen,
  date: string,
  duration: Duration,
  now: Date = new Date(),
): Slot[] {
  if (isDateBlocked(screen, date)) return [];

  const startMin = screen.operatingStart * 60;
  const endMin = screen.operatingEnd * 60;
  const durMin = duration * 60;
  const lastStart = endMin - durMin;
  if (lastStart < startMin) return [];

  const { date: istDate, minutes: istMin } = istDateAndMinutes(now);
  const isToday = date === istDate;

  const slots: Slot[] = [];
  for (let s = startMin; s <= lastStart; s += SLOT_STEP_MIN) {
    if (isToday && s <= istMin) continue;
    slots.push({
      startTime: minutesToTime(s),
      endTime: minutesToTime(s + durMin),
      durationHours: duration,
    });
  }
  return slots;
}

function activeBookings(bookings: Booking[]): Booking[] {
  return bookings.filter((b) => b.status !== "cancelled");
}

export function getAvailableSlots(
  screen: Screen,
  date: string,
  duration: Duration,
  existingBookings: Booking[],
  now: Date = new Date(),
): Slot[] {
  const candidates = generateCandidateSlots(screen, date, duration, now);
  const conflicts = activeBookings(existingBookings)
    .filter((b) => b.screenId === screen.id && b.date === date)
    .map((b) => ({ start: timeToMinutes(b.startTime), end: timeToMinutes(b.endTime) }));

  if (conflicts.length === 0) return candidates;

  return candidates.filter((slot) => {
    const s = timeToMinutes(slot.startTime);
    const e = timeToMinutes(slot.endTime);
    return !conflicts.some((c) => rangesOverlap(s, e, c.start, c.end));
  });
}

export function getAvailabilityForDate(
  screen: Screen,
  date: string,
  existingBookings: Booking[],
  now: Date = new Date(),
): Availability {
  return {
    "1h": getAvailableSlots(screen, date, 1, existingBookings, now),
    "2h": getAvailableSlots(screen, date, 2, existingBookings, now),
    "3h": getAvailableSlots(screen, date, 3, existingBookings, now),
  };
}

export function checkSlotStillAvailable(
  screen: Screen,
  date: string,
  startTime: string,
  duration: Duration,
  existingBookings: Booking[],
  now: Date = new Date(),
): boolean {
  const slots = getAvailableSlots(screen, date, duration, existingBookings, now);
  return slots.some((s) => s.startTime === startTime);
}
