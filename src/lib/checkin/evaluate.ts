import { istDateAndMinutes } from "@/lib/slots/engine";
import type { Booking, CheckInStatus } from "@/types";

/** How many minutes before the slot start a guest may be admitted. */
export const EARLY_GRACE_MIN = 30;

export type CheckInTiming =
  | "wrong-day-past"
  | "wrong-day-future"
  | "early"
  | "on-time"
  | "expired";

export type CheckInRecommendation = "admit" | "review" | "block";

export type CheckInEvaluation = {
  /** Normalized check-in status (undefined → "awaiting"). */
  status: CheckInStatus;
  timing: CheckInTiming;
  isConfirmed: boolean;
  isCancelled: boolean;
  isCompleted: boolean;
  alreadyAdmitted: boolean;
  alreadyRejected: boolean;
  recommendation: CheckInRecommendation;
  /** Human-readable reasons the admin should notice before deciding. */
  warnings: string[];
  /** IST "today" + minutes-since-midnight used for the timing decision. */
  istDate: string;
  istMinutes: number;
};

function hhmmToMin(t: string): number {
  const [h, m] = t.split(":");
  return Number(h) * 60 + Number(m);
}

export function normalizeCheckInStatus(b: Booking): CheckInStatus {
  return b.checkInStatus ?? "awaiting";
}

/**
 * Pure evaluation of whether a booking should be admitted right now. Computes
 * timing in IST and surfaces every reason for caution; the admin still makes
 * the final call (and can override). No I/O — fully unit-testable.
 */
export function evaluateCheckIn(
  booking: Booking,
  now: Date = new Date(),
): CheckInEvaluation {
  const { date: istDate, minutes: istMinutes } = istDateAndMinutes(now);
  const status = normalizeCheckInStatus(booking);
  const isConfirmed = booking.status === "confirmed";
  const isCancelled = booking.status === "cancelled";
  const isCompleted = booking.status === "completed";
  const alreadyAdmitted = status === "admitted";
  const alreadyRejected = status === "rejected";

  // Timing is evaluated same-day: the calendar-date comparison short-circuits
  // before the early-grace window, so the 30-min grace intentionally does not
  // span midnight (only relevant for a hypothetical 00:00-opening screen; the
  // default operating start is 09:00). A near-midnight early scan is flagged as
  // wrong-day → "review", which the admin can override.
  let timing: CheckInTiming;
  if (booking.date < istDate) timing = "wrong-day-past";
  else if (booking.date > istDate) timing = "wrong-day-future";
  else {
    const start = hhmmToMin(booking.startTime);
    const end = hhmmToMin(booking.endTime);
    if (istMinutes < start - EARLY_GRACE_MIN) timing = "early";
    else if (istMinutes > end) timing = "expired";
    else timing = "on-time";
  }

  const warnings: string[] = [];
  if (isCancelled) warnings.push("This booking is cancelled.");
  if (isCompleted) warnings.push("This booking is already marked completed.");
  if (!isConfirmed && !isCancelled && !isCompleted) {
    warnings.push(`Booking status is "${booking.status}", not confirmed.`);
  }
  if (timing === "wrong-day-past") {
    warnings.push("This booking was for an earlier date.");
  }
  if (timing === "wrong-day-future") {
    warnings.push("This booking is for a future date.");
  }
  if (timing === "early") {
    warnings.push("The guest is early — the slot hasn't started yet.");
  }
  if (timing === "expired") warnings.push("The slot has already ended.");
  if (alreadyAdmitted) warnings.push("Already admitted.");
  if (alreadyRejected) warnings.push("Previously rejected at entry.");

  let recommendation: CheckInRecommendation;
  if (isCancelled) recommendation = "block";
  else if (isConfirmed && timing === "on-time" && !alreadyAdmitted) {
    recommendation = "admit";
  } else recommendation = "review";

  return {
    status,
    timing,
    isConfirmed,
    isCancelled,
    isCompleted,
    alreadyAdmitted,
    alreadyRejected,
    recommendation,
    warnings,
    istDate,
    istMinutes,
  };
}
