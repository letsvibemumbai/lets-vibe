import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { parseWorkbook } from "./parseWorkbook";

// Build an in-memory workbook matching the owner's layout (data from row 5)
// with a deliberately duplicated booking Sr No and an identical expense row,
// so we can assert the parser refuses to take duplicates.
async function buildWorkbook(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();

  const bk = wb.addWorksheet("Booking");
  const setBk = (r: number, vals: (string | number)[]) =>
    vals.forEach((v, i) => {
      bk.getCell(r, i + 1).value = v as ExcelJS.CellValue;
    });
  // [sr, bookingDate, slotDate, name, contact, theme, hour, person, time, room, food]
  setBk(5, [1, "2026-06-30", "2026-07-01", "Alice", "9000000001", "Beach", 2, 2, "6 pm to 8", 4000, 0]);
  setBk(6, [1, "2026-06-30", "2026-07-01", "Alice", "9000000001", "Beach", 2, 2, "6 pm to 8", 4000, 0]); // duplicate Sr
  setBk(7, [2, "2026-07-01", "2026-07-02", "Bob", "9000000002", "Nature", 1, 2, "7 pm to 8", 3000, 0]);

  const ex = wb.addWorksheet("Expense");
  const setEx = (r: number, vals: (string | number)[]) =>
    vals.forEach((v, i) => {
      ex.getCell(r, i + 1).value = v as ExcelJS.CellValue;
    });
  // [date, inCash, inOnline, outCash, outOnline, detail]
  setEx(5, ["2026-07-01", 0, 0, 500, 0, "Cake"]);
  setEx(6, ["2026-07-01", 0, 0, 500, 0, "Cake"]); // identical expense
  setEx(7, ["2026-07-02", 0, 0, 0, 300, "Balloons"]);

  return Buffer.from(await wb.xlsx.writeBuffer());
}

describe("parseWorkbook — duplicates are never taken", () => {
  it("imports a repeated booking Sr No only once", async () => {
    const result = await parseWorkbook(await buildWorkbook());
    expect(result.bookings.map((b) => b.id).sort()).toEqual([
      "xls-b-1",
      "xls-b-2",
    ]);
    expect(result.warnings.some((w) => /duplicate Sr No/i.test(w))).toBe(true);
  });

  it("imports an identical expense row only once and never double-counts", async () => {
    const result = await parseWorkbook(await buildWorkbook());
    expect(result.expenses).toHaveLength(2); // Cake (once) + Balloons
    expect(result.totals.expensesOut).toBe(800); // 500 + 300, not 1300
    expect(
      result.warnings.some((w) => /duplicate of an earlier identical row/i.test(w)),
    ).toBe(true);
  });

  it("keeps canonical expense ids with no occurrence suffix", async () => {
    const result = await parseWorkbook(await buildWorkbook());
    for (const e of result.expenses) {
      expect(e.id).toMatch(/^xls-e-[0-9a-f]{12}$/);
    }
  });
});
