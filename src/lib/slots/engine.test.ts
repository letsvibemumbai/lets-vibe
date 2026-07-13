import { describe, expect, it } from "vitest";
import type { Booking, Duration, Screen, ScreenId } from "@/types";
import {
  checkSlotStillAvailable,
  generateCandidateSlots,
  getAllSlotsWithStatus,
  getAvailabilityForDate,
  getAvailabilityWithStatusForDate,
  getAvailableSlots,
  minutesToTime,
  rangesOverlap,
  timeToMinutes,
} from "./engine";
import { calculateBookingPrice } from "./pricing";

function makeScreen(overrides: Partial<Screen> = {}): Screen {
  return {
    id: "beach",
    name: "Beach Vibes",
    theme: "beach",
    description: "",
    operatingStart: 0,
    operatingEnd: 24,
    basePrices: { "1h": 1500, "2h": 2500, "3h": 3500 },
    imageUrl: "",
    ...overrides,
  };
}

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "b1",
    screenId: "beach",
    date: "2026-05-22",
    startTime: "11:00",
    endTime: "12:00",
    duration: 1,
    customerName: "Test",
    customerPhone: "0000",
    guestCount: 2,
    addOns: {},
    amount: 1500,
    amountPaid: 1500,
    status: "confirmed",
    source: "online",
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

const DATE = "2026-05-22";
// IST = UTC+5:30. UTC 19:00 on 2026-05-21 == IST 00:30 on 2026-05-22.
// Use a `now` that's the day BEFORE the test date in IST so the "today filter"
// never trips by accident.
const NOT_TODAY_NOW = new Date("2026-05-20T00:00:00Z");

describe("time helpers", () => {
  it("timeToMinutes converts HH:mm", () => {
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("14:30")).toBe(870);
    expect(timeToMinutes("24:00")).toBe(1440);
  });

  it("minutesToTime converts back", () => {
    expect(minutesToTime(0)).toBe("00:00");
    expect(minutesToTime(870)).toBe("14:30");
    expect(minutesToTime(1440)).toBe("24:00");
  });

  it("rangesOverlap is open-ended (back-to-back is not overlap)", () => {
    expect(rangesOverlap(60, 120, 120, 180)).toBe(false);
    expect(rangesOverlap(60, 120, 119, 180)).toBe(true);
    expect(rangesOverlap(60, 120, 0, 60)).toBe(false);
    expect(rangesOverlap(60, 120, 0, 61)).toBe(true);
  });
});

describe("generateCandidateSlots", () => {
  it("returns all 30-min starts in operating window for 1h slots", () => {
    const screen = makeScreen({ operatingStart: 0, operatingEnd: 24 });
    const slots = generateCandidateSlots(screen, DATE, 1, NOT_TODAY_NOW);
    // 0:00 ... 23:00 in 30-min steps → 47 candidates
    expect(slots).toHaveLength(47);
    expect(slots[0]).toEqual({ startTime: "00:00", endTime: "01:00", durationHours: 1 });
    expect(slots[slots.length - 1]).toEqual({
      startTime: "23:00",
      endTime: "24:00",
      durationHours: 1,
    });
  });

  it("respects operating hours (no slots before start or ending after end)", () => {
    const screen = makeScreen({ operatingStart: 10, operatingEnd: 22 });
    const slots = generateCandidateSlots(screen, DATE, 1, NOT_TODAY_NOW);
    expect(slots[0]?.startTime).toBe("10:00");
    expect(slots[slots.length - 1]?.endTime).toBe("22:00");
    expect(slots.some((s) => timeToMinutes(s.startTime) < 600)).toBe(false);
    expect(slots.some((s) => timeToMinutes(s.endTime) > 1320)).toBe(false);
  });

  it("returns no slots when operating window is shorter than duration", () => {
    const screen = makeScreen({ operatingStart: 10, operatingEnd: 12 });
    expect(generateCandidateSlots(screen, DATE, 3, NOT_TODAY_NOW)).toEqual([]);
  });

  it("filters past slots when date is today in Asia/Kolkata", () => {
    // IST 14:00 on 2026-05-22 == UTC 08:30 on 2026-05-22.
    const nowIst1400 = new Date("2026-05-22T08:30:00Z");
    const screen = makeScreen({ operatingStart: 10, operatingEnd: 22 });
    const slots = generateCandidateSlots(screen, DATE, 1, nowIst1400);
    expect(slots.every((s) => timeToMinutes(s.startTime) > 14 * 60)).toBe(true);
    expect(slots[0]?.startTime).toBe("14:30");
  });

  it("does NOT filter when date is a future day even if now is late", () => {
    const lateNight = new Date("2026-05-21T18:30:00Z"); // IST midnight 22nd
    const screen = makeScreen({ operatingStart: 10, operatingEnd: 22 });
    const slots = generateCandidateSlots(screen, DATE, 1, lateNight);
    expect(slots[0]?.startTime).toBe("10:00");
  });
});

describe("getAvailableSlots", () => {
  const screen = makeScreen({ operatingStart: 0, operatingEnd: 24 });

  it("returns all candidates when there are no bookings", () => {
    const slots = getAvailableSlots(screen, DATE, 1, [], NOT_TODAY_NOW);
    expect(slots).toHaveLength(47);
  });

  it("3h: blocks 9-12, 10-13, 11-14 (and other overlapping starts); 12-15 onward is allowed", () => {
    const slots = getAvailableSlots(
      screen,
      DATE,
      3,
      [makeBooking({ startTime: "11:00", endTime: "12:00" })],
      NOT_TODAY_NOW,
    );
    const starts = slots.map((s) => s.startTime);
    expect(starts).not.toContain("09:00");
    expect(starts).not.toContain("09:30");
    expect(starts).not.toContain("10:00");
    expect(starts).not.toContain("10:30");
    expect(starts).not.toContain("11:00");
    expect(starts).not.toContain("11:30");
    expect(starts).toContain("12:00");
    expect(starts).toContain("12:30");
    // and the slot ending right before the booking is fine
    expect(starts).toContain("08:00");
  });

  it("1h: excludes the overlapping slot but allows back-to-back on both sides", () => {
    const slots = getAvailableSlots(
      screen,
      DATE,
      1,
      [makeBooking({ startTime: "11:00", endTime: "12:00" })],
      NOT_TODAY_NOW,
    );
    const starts = slots.map((s) => s.startTime);
    expect(starts).not.toContain("11:00");
    expect(starts).not.toContain("10:30"); // 10:30-11:30 overlaps
    expect(starts).toContain("10:00"); // 10:00-11:00 back-to-back
    expect(starts).toContain("12:00"); // 12:00-13:00 back-to-back
    expect(starts).toContain("13:00");
  });

  it("2h: 9-11 and 12-14 are valid; 10-12 and 11-13 are not", () => {
    const slots = getAvailableSlots(
      screen,
      DATE,
      2,
      [makeBooking({ startTime: "11:00", endTime: "12:00" })],
      NOT_TODAY_NOW,
    );
    const starts = slots.map((s) => s.startTime);
    expect(starts).toContain("09:00"); // 09:00-11:00 OK
    expect(starts).toContain("12:00"); // 12:00-14:00 OK
    expect(starts).not.toContain("09:30"); // 09:30-11:30 overlaps
    expect(starts).not.toContain("10:00"); // 10:00-12:00 overlaps (start)
    expect(starts).not.toContain("10:30");
    expect(starts).not.toContain("11:00");
    expect(starts).not.toContain("11:30");
  });

  it("two non-adjacent bookings (10-11 and 15-16): 3h fits 11-14 and 12-15", () => {
    const slots = getAvailableSlots(
      screen,
      DATE,
      3,
      [
        makeBooking({ id: "b1", startTime: "10:00", endTime: "11:00" }),
        makeBooking({ id: "b2", startTime: "15:00", endTime: "16:00" }),
      ],
      NOT_TODAY_NOW,
    );
    const starts = slots.map((s) => s.startTime);
    expect(starts).toContain("11:00"); // 11-14
    expect(starts).toContain("11:30"); // 11:30-14:30
    expect(starts).toContain("12:00"); // 12-15 (back-to-back end)
    expect(starts).not.toContain("12:30"); // 12:30-15:30 overlaps 15-16
    expect(starts).not.toContain("13:00"); // 13-16 overlaps
    expect(starts).not.toContain("09:00"); // 9-12 overlaps 10-11
    expect(starts).toContain("16:00"); // 16-19 is back-to-back with 15-16, allowed
  });

  it("cancelled bookings do not block slots", () => {
    const slots = getAvailableSlots(
      screen,
      DATE,
      1,
      [makeBooking({ status: "cancelled", startTime: "11:00", endTime: "12:00" })],
      NOT_TODAY_NOW,
    );
    expect(slots.map((s) => s.startTime)).toContain("11:00");
  });

  it("bookings on a different screen do not block this screen", () => {
    const slots = getAvailableSlots(
      screen,
      DATE,
      1,
      [
        makeBooking({
          screenId: "grass" as ScreenId,
          startTime: "11:00",
          endTime: "12:00",
        }),
      ],
      NOT_TODAY_NOW,
    );
    expect(slots.map((s) => s.startTime)).toContain("11:00");
  });

  it("bookings on a different date do not block", () => {
    const slots = getAvailableSlots(
      screen,
      DATE,
      1,
      [
        makeBooking({ date: "2026-05-23", startTime: "11:00", endTime: "12:00" }),
      ],
      NOT_TODAY_NOW,
    );
    expect(slots.map((s) => s.startTime)).toContain("11:00");
  });

  it("returns empty when window cannot fit duration", () => {
    const tight = makeScreen({ operatingStart: 10, operatingEnd: 12 });
    expect(getAvailableSlots(tight, DATE, 3, [], NOT_TODAY_NOW)).toEqual([]);
  });
});

describe("blocked dates", () => {
  it("returns no candidates when the date is in blockedDates", () => {
    const screen = makeScreen({ blockedDates: [DATE] });
    expect(generateCandidateSlots(screen, DATE, 1, NOT_TODAY_NOW)).toEqual([]);
    expect(getAvailableSlots(screen, DATE, 1, [], NOT_TODAY_NOW)).toEqual([]);
  });

  it("does not block other dates on the same screen", () => {
    const screen = makeScreen({ blockedDates: ["2026-06-01"] });
    const slots = getAvailableSlots(screen, DATE, 1, [], NOT_TODAY_NOW);
    expect(slots.length).toBeGreaterThan(0);
  });

  it("checkSlotStillAvailable returns false for blocked dates", () => {
    const screen = makeScreen({ blockedDates: [DATE] });
    expect(
      checkSlotStillAvailable(screen, DATE, "14:00", 1, [], NOT_TODAY_NOW),
    ).toBe(false);
  });
});

describe("getAvailabilityForDate", () => {
  it("returns slots bucketed by duration", () => {
    const screen = makeScreen();
    const result = getAvailabilityForDate(screen, DATE, [], NOT_TODAY_NOW);
    expect(result["1h"].length).toBe(47);
    expect(result["2h"].length).toBe(45);
    expect(result["3h"].length).toBe(43);
  });
});

describe("getAllSlotsWithStatus (reserved shown, not hidden)", () => {
  const screen = makeScreen({ operatingStart: 10, operatingEnd: 22 });

  it("keeps every candidate and flags all available when nothing is booked", () => {
    const all = getAllSlotsWithStatus(screen, DATE, 2, [], NOT_TODAY_NOW);
    const avail = getAvailableSlots(screen, DATE, 2, [], NOT_TODAY_NOW);
    expect(all).toHaveLength(avail.length);
    expect(all.every((s) => s.available === true)).toBe(true);
  });

  it("marks overlapping slots reserved but keeps them in the list", () => {
    const booking = makeBooking({
      screenId: screen.id,
      date: DATE,
      startTime: "14:00",
      endTime: "16:00",
      duration: 2,
    });
    const all = getAllSlotsWithStatus(screen, DATE, 2, [booking], NOT_TODAY_NOW);
    // Reserved slots are NOT removed — the full candidate set is preserved.
    expect(all).toHaveLength(
      getAllSlotsWithStatus(screen, DATE, 2, [], NOT_TODAY_NOW).length,
    );
    // 14:00 overlaps the booking → reserved; 12:00 (12–14) is back-to-back → free.
    expect(all.find((s) => s.startTime === "14:00")?.available).toBe(false);
    expect(all.find((s) => s.startTime === "12:00")?.available).toBe(true);
    // The available subset matches the available-only helper exactly.
    const availOnly = getAvailableSlots(screen, DATE, 2, [booking], NOT_TODAY_NOW);
    expect(
      all.filter((s) => s.available).map((s) => s.startTime).sort(),
    ).toEqual(availOnly.map((s) => s.startTime).sort());
  });

  it("flags reserved slots across every duration bucket", () => {
    const booking = makeBooking({
      screenId: screen.id,
      date: DATE,
      startTime: "14:00",
      endTime: "16:00",
      duration: 2,
    });
    const avail = getAvailabilityWithStatusForDate(
      screen,
      DATE,
      [booking],
      NOT_TODAY_NOW,
    );
    expect(avail["1h"].some((s) => s.available === false)).toBe(true);
    expect(avail["2h"].some((s) => s.available === false)).toBe(true);
    expect(avail["3h"].some((s) => s.available === false)).toBe(true);
  });
});

describe("checkSlotStillAvailable", () => {
  const screen = makeScreen();

  it("returns true for an available slot", () => {
    const ok = checkSlotStillAvailable(screen, DATE, "14:00", 1, [], NOT_TODAY_NOW);
    expect(ok).toBe(true);
  });

  it("returns false once a conflicting booking exists", () => {
    const ok = checkSlotStillAvailable(
      screen,
      DATE,
      "14:00",
      1,
      [makeBooking({ startTime: "14:00", endTime: "15:00" })],
      NOT_TODAY_NOW,
    );
    expect(ok).toBe(false);
  });
});

describe("calculateBookingPrice", () => {
  it("returns the base price for the given duration", () => {
    const beach = makeScreen();
    expect(calculateBookingPrice(beach, 1 as Duration, {})).toBe(1500);
    expect(calculateBookingPrice(beach, 2 as Duration, {})).toBe(2500);
    expect(calculateBookingPrice(beach, 3 as Duration, {})).toBe(3500);
  });

  it("adds each selection's unitPrice * quantity", () => {
    const beach = makeScreen();
    const result = calculateBookingPrice(beach, 2 as Duration, {
      selections: [
        { kind: "package", id: "p1", name: "Romantic", unitPrice: 800, quantity: 1 },
        { kind: "item", id: "i1", name: "Cake", unitPrice: 500, quantity: 2 },
      ],
    });
    expect(result).toBe(2500 + 800 + 500 * 2);
  });

  it("includes an experience package selection like any other selection", () => {
    const beach = makeScreen();
    const result = calculateBookingPrice(beach, 2 as Duration, {
      selections: [
        {
          kind: "package",
          id: "celebration",
          name: "Celebration",
          unitPrice: 2000,
          quantity: 1,
          experience: true,
        },
      ],
    });
    expect(result).toBe(2500 + 2000);
  });

  it("treats missing selections as no add-ons", () => {
    const beach = makeScreen();
    expect(calculateBookingPrice(beach, 2 as Duration, {})).toBe(2500);
    expect(
      calculateBookingPrice(beach, 2 as Duration, { selections: [] }),
    ).toBe(2500);
  });
});
