import { describe, expect, it } from "vitest";
import { parseTimeRange } from "./parseTime";

describe("parseTimeRange", () => {
  const cases: Array<[string, number, string, string]> = [
    ["10 pm to 12", 2, "22:00", "00:00"], // midnight wrap
    ["8.30 pm to 10.30", 1.5, "20:30", "22:30"],
    ["1 pm to 5", 5, "13:00", "17:00"],
    ["8 to 10 am", 2, "08:00", "10:00"],
    ["11.30 am to 1.30", 2, "11:30", "13:30"], // cross-noon am->pm
    ["11 to 6 pm", 7, "11:00", "18:00"], // start am inferred
    ["1 Am to 3", 2, "01:00", "03:00"],
    ["11 to 1 pm", 2, "11:00", "13:00"],
    ["8.15 to 10.15", 2, "20:15", "22:15"], // no meridiem -> evening
    ["3pm to 6", 3, "15:00", "18:00"],
    ["6.45 to 7.45", 1, "18:45", "19:45"],
  ];
  for (const [raw, hour, start, end] of cases) {
    it(`"${raw}" (${hour}h) -> ${start}-${end}`, () => {
      expect(parseTimeRange(raw, hour)).toEqual({ start, end });
    });
  }

  it("returns null for blank / non-range text", () => {
    expect(parseTimeRange("", 2)).toBeNull();
    expect(parseTimeRange("evening", 2)).toBeNull();
  });
});
