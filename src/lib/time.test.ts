import { describe, expect, it } from "vitest";
import { formatClock, formatClockRange, formatHour } from "./time";

describe("formatClock", () => {
  it("formats 24-hour", () => {
    expect(formatClock("14:30", "24")).toBe("14:30");
    expect(formatClock("9:00", "24")).toBe("09:00");
    expect(formatClock("00:00", "24")).toBe("00:00");
  });

  it("formats 12-hour with AM/PM", () => {
    expect(formatClock("14:30", "12")).toBe("2:30 PM");
    expect(formatClock("09:00", "12")).toBe("9:00 AM");
    expect(formatClock("00:00", "12")).toBe("12:00 AM");
    expect(formatClock("12:00", "12")).toBe("12:00 PM");
    expect(formatClock("23:15", "12")).toBe("11:15 PM");
    expect(formatClock("22:00", "12")).toBe("10:00 PM");
  });

  it("passes through unparseable input", () => {
    expect(formatClock("", "12")).toBe("");
    expect(formatClock("nope", "24")).toBe("nope");
  });
});

describe("formatClockRange", () => {
  it("joins with a separator", () => {
    expect(formatClockRange("14:30", "16:30", "12")).toBe("2:30 PM – 4:30 PM");
    expect(formatClockRange("14:30", "16:30", "24")).toBe("14:30 – 16:30");
    expect(formatClockRange("22:00", "00:00", "12")).toBe("10:00 PM – 12:00 AM");
  });
});

describe("formatHour", () => {
  it("formats operating hours", () => {
    expect(formatHour(9, "24")).toBe("09:00");
    expect(formatHour(9, "12")).toBe("9:00 AM");
    expect(formatHour(21, "12")).toBe("9:00 PM");
    expect(formatHour(21, "24")).toBe("21:00");
  });
});
