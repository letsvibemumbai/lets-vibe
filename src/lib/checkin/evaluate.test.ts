import { describe, it, expect } from "vitest";
import { evaluateCheckIn } from "./evaluate";
import type { Booking } from "@/types";

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "b1",
    screenId: "beach",
    date: "2026-06-14",
    startTime: "18:00",
    endTime: "20:00",
    duration: 2,
    customerName: "Test Guest",
    customerPhone: "9876543210",
    guestCount: 2,
    addOns: {},
    amount: 2500,
    amountPaid: 0,
    status: "confirmed",
    source: "online",
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

// Dates are given with an explicit +05:30 (IST) offset so the assertions are
// independent of the machine's local timezone.
const ist = (iso: string) => new Date(iso);

describe("evaluateCheckIn", () => {
  it("recommends admit for a confirmed booking during its slot", () => {
    const e = evaluateCheckIn(makeBooking(), ist("2026-06-14T18:30:00+05:30"));
    expect(e.timing).toBe("on-time");
    expect(e.recommendation).toBe("admit");
    expect(e.status).toBe("awaiting");
  });

  it("treats arrival within the 30-min early grace as on-time", () => {
    const e = evaluateCheckIn(makeBooking(), ist("2026-06-14T17:35:00+05:30"));
    expect(e.timing).toBe("on-time");
  });

  it("flags arrival earlier than the grace window", () => {
    const e = evaluateCheckIn(makeBooking(), ist("2026-06-14T17:00:00+05:30"));
    expect(e.timing).toBe("early");
    expect(e.recommendation).toBe("review");
  });

  it("flags an expired slot", () => {
    const e = evaluateCheckIn(makeBooking(), ist("2026-06-14T20:30:00+05:30"));
    expect(e.timing).toBe("expired");
    expect(e.recommendation).toBe("review");
  });

  it("detects a future-dated booking", () => {
    const e = evaluateCheckIn(makeBooking(), ist("2026-06-13T18:30:00+05:30"));
    expect(e.timing).toBe("wrong-day-future");
    expect(e.recommendation).toBe("review");
  });

  it("detects a past-dated booking", () => {
    const e = evaluateCheckIn(makeBooking(), ist("2026-06-15T18:30:00+05:30"));
    expect(e.timing).toBe("wrong-day-past");
  });

  it("blocks a cancelled booking", () => {
    const e = evaluateCheckIn(
      makeBooking({ status: "cancelled" }),
      ist("2026-06-14T18:30:00+05:30"),
    );
    expect(e.isCancelled).toBe(true);
    expect(e.recommendation).toBe("block");
  });

  it("downgrades to review for an already-admitted booking", () => {
    const e = evaluateCheckIn(
      makeBooking({ checkInStatus: "admitted" }),
      ist("2026-06-14T18:30:00+05:30"),
    );
    expect(e.alreadyAdmitted).toBe(true);
    expect(e.recommendation).toBe("review");
  });

  it("downgrades to review for a non-confirmed booking", () => {
    const e = evaluateCheckIn(
      makeBooking({ status: "pending" }),
      ist("2026-06-14T18:30:00+05:30"),
    );
    expect(e.isConfirmed).toBe(false);
    expect(e.recommendation).toBe("review");
  });
});
