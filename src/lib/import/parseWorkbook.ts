import { createHash } from "node:crypto";
import ExcelJS from "exceljs";
import { parseTimeRange } from "@/lib/import/parseTime";
import type {
  Booking,
  BookingPayment,
  Duration,
  Expense,
  ExpenseCategory,
  ScreenId,
} from "@/types";

/**
 * Parses the owner's `Lets vibe.xlsx` workbook ("Booking" + "Expense" sheets)
 * into shaped `Booking`/`Expense` records ready for an ADD-NEW-ONLY import.
 *
 * The workbook is the owner's hand-kept source of truth. Rows 1-4 of each sheet
 * are headers/running totals; real data begins at row 5. Ids are deterministic
 * so re-importing the same workbook never duplicates rows:
 *   - bookings → `xls-b-{Sr}`
 *   - expenses → `xls-e-{sha1(date|detail|method|amount)[:12]}`
 * Duplicate rows are collapsed to a single entry (a repeated Sr No, or an
 * identical date/detail/method/amount expense row, is imported only once), so
 * re-importing the same workbook never adds a duplicate.
 * Pure-ish: reads only the passed buffer, no I/O.
 */

const BOOKING_SHEET = "Booking";
const EXPENSE_SHEET = "Expense";
const DATA_START_ROW = 5;

// Booking sheet columns (1-indexed).
const B = {
  sr: 1,
  bookingDate: 2,
  slotDate: 3,
  name: 4,
  contact: 5,
  theme: 6,
  hour: 7,
  person: 8,
  time: 9,
  totalAmount: 10, // ROOM only, despite the "Total Amount" header
  foodBill: 11,
  advanceCash: 12,
  advanceOnline: 13,
  balanceCash: 14,
  balanceOnline: 15,
  difference: 16,
  reference: 17,
} as const;

// Expense sheet columns (1-indexed).
const E = {
  date: 1,
  inCash: 2,
  inOnline: 3,
  outCash: 4,
  outOnline: 5,
  detail: 6,
} as const;

export type ImportedBooking = Omit<Booking, "createdAt" | "updatedAt"> & {
  createdAt: number;
  updatedAt: number;
};
export type ImportedExpense = Omit<Expense, "createdAt"> & { createdAt: number };

export type ParseResult = {
  bookings: ImportedBooking[];
  expenses: ImportedExpense[];
  warnings: string[];
  totals: {
    bookingCount: number;
    roomRevenue: number;
    foodBill: number;
    billed: number;
    advanceCash: number;
    advanceOnline: number;
    balanceCash: number;
    balanceOnline: number;
    collected: number;
    outstanding: number;
    expenseCount: number;
    expensesOut: number;
  };
};

/** Cell value shapes ExcelJS can hand back for a single cell. */
type RichText = { richText: { text: string }[] };
type FormulaResult = { result?: unknown; text?: unknown };
type HyperlinkCell = { text?: unknown; hyperlink?: unknown };

/** Extract a primitive (string | number | Date | null) from any ExcelJS cell value. */
function cellPrimitive(value: unknown): string | number | Date | null {
  if (value == null) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "object") {
    const v = value as Record<string, unknown>;
    if ("richText" in v && Array.isArray((v as RichText).richText)) {
      return (v as RichText).richText.map((r) => r.text).join("");
    }
    if ("result" in v) {
      const r = (v as FormulaResult).result;
      if (r instanceof Date) return r;
      if (typeof r === "string" || typeof r === "number") return r;
      return null;
    }
    if ("text" in v) {
      const t = (v as HyperlinkCell).text;
      if (typeof t === "string" || typeof t === "number") return t;
    }
    if ("hyperlink" in v) {
      const h = (v as HyperlinkCell).hyperlink;
      if (typeof h === "string") return h;
    }
  }
  return null;
}

function cellNumber(value: unknown): number {
  const p = cellPrimitive(value);
  if (p == null) return 0;
  if (p instanceof Date) return 0;
  const n = typeof p === "number" ? p : Number(String(p).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function cellText(value: unknown): string {
  const p = cellPrimitive(value);
  if (p == null) return "";
  if (p instanceof Date) return p.toISOString();
  return String(p).trim();
}

/** Convert a cell (Date object or dd/mm/yyyy-ish string) to "YYYY-MM-DD" or null. */
function toDateISO(value: unknown): string | null {
  const p = cellPrimitive(value);
  if (p == null) return null;
  if (p instanceof Date) {
    return `${p.getUTCFullYear()}-${pad2(p.getUTCMonth() + 1)}-${pad2(p.getUTCDate())}`;
  }
  const s = String(p).trim();
  if (!s) return null;
  // Already ISO-ish (YYYY-MM-DD or full ISO string).
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  // dd/mm/yyyy or dd-mm-yyyy (owner's locale is day-first).
  const dmy = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (dmy) {
    const [, d, m, yRaw] = dmy;
    const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
    return `${y}-${pad2(Number(m))}-${pad2(Number(d))}`;
  }
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getUTCFullYear()}-${pad2(parsed.getUTCMonth() + 1)}-${pad2(parsed.getUTCDate())}`;
  }
  return null;
}

/** Millis (UTC midnight) for a cell date, or null. */
function toDateMillis(value: unknown): number | null {
  const p = cellPrimitive(value);
  if (p instanceof Date) return p.getTime();
  const iso = toDateISO(value);
  if (!iso) return null;
  const ms = Date.parse(`${iso}T00:00:00.000Z`);
  return Number.isNaN(ms) ? null : ms;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Add `hours` to an "HH:mm" start time, returning "HH:mm" (wraps at 24h). */
function addHours(start: string, hours: number): string {
  const [h, m] = start.split(":").map((x) => parseInt(x, 10));
  const total = (((h * 60 + m + hours * 60) % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

/** Map the free-text "Theme" column to a ScreenId (case-insensitive keywords). */
function themeToScreenId(theme: string): { screenId: ScreenId; matched: boolean } {
  const t = theme.toLowerCase();
  if (t.includes("beach")) return { screenId: "beach", matched: true };
  if (t.includes("nature") || t.includes("jungle") || t.includes("forest")) {
    return { screenId: "forest", matched: true };
  }
  if (t.includes("love") || t.includes("den") || t.includes("grass")) {
    return { screenId: "grass", matched: true };
  }
  return { screenId: "beach", matched: false };
}

/** Digits-only phone; prefer the last 10 digits. */
function normalizePhone(raw: string): { phone: string; valid: boolean } {
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 10) {
    return { phone: digits.slice(-10), valid: true };
  }
  return { phone: digits, valid: false };
}

/** Keyword → ExpenseCategory from the free-text Detail column. */
function categorize(detail: string): ExpenseCategory {
  const d = detail.toLowerCase();
  if (/cake|food|snack|petal|attar|balloon|decor/.test(d)) return "supplies";
  if (/insta|influ|reel|ad|market|promo/.test(d)) return "marketing";
  if (/electric|wifi|internet|water|rent/.test(d)) return "utilities";
  if (/salary|staff|helper/.test(d)) return "staff";
  if (/repair|fix|maintenance/.test(d)) return "maintenance";
  if (/metro|travel|fuel|auto|cab/.test(d)) return "other";
  return "other";
}

export async function parseWorkbook(
  buffer: ArrayBuffer | Buffer,
): Promise<ParseResult> {
  const wb = new ExcelJS.Workbook();
  // exceljs accepts a Buffer; ArrayBuffer is coerced. The cast bridges the
  // node `Buffer<ArrayBufferLike>` generic to exceljs's plain `Buffer` type.
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  await wb.xlsx.load(buf as unknown as Parameters<typeof wb.xlsx.load>[0]);

  const warnings: string[] = [];
  const bookings: ImportedBooking[] = [];
  const expenses: ImportedExpense[] = [];
  const totals: ParseResult["totals"] = {
    bookingCount: 0,
    roomRevenue: 0,
    foodBill: 0,
    billed: 0,
    advanceCash: 0,
    advanceOnline: 0,
    balanceCash: 0,
    balanceOnline: 0,
    collected: 0,
    outstanding: 0,
    expenseCount: 0,
    expensesOut: 0,
  };

  const today = todayISO();

  // ---- Booking sheet ----
  const bookingSheet = wb.getWorksheet(BOOKING_SHEET);
  if (!bookingSheet) {
    warnings.push(`Worksheet "${BOOKING_SHEET}" not found.`);
  } else {
    // Duplicate guard: a repeated Sr No is imported only once.
    const seenBookingIds = new Set<string>();
    for (let r = DATA_START_ROW; r <= bookingSheet.rowCount; r++) {
      const row = bookingSheet.getRow(r);
      const srNum = cellNumber(row.getCell(B.sr).value);
      const name = cellText(row.getCell(B.name).value);
      // Skip empty / header-total rows.
      if (!srNum || !name) continue;
      const sr = Math.trunc(srNum);
      const id = `xls-b-${sr}`;
      if (seenBookingIds.has(id)) {
        warnings.push(`Sr ${sr}: duplicate Sr No in the sheet — imported only once.`);
        continue;
      }
      seenBookingIds.add(id);

      const dateISO = toDateISO(row.getCell(B.slotDate).value);
      if (!dateISO) {
        warnings.push(`Sr ${sr}: could not parse slot date — row skipped.`);
        continue;
      }

      const { screenId, matched } = themeToScreenId(
        cellText(row.getCell(B.theme).value),
      );
      if (!matched) {
        warnings.push(
          `Sr ${sr}: unknown theme "${cellText(row.getCell(B.theme).value)}" — defaulted to beach.`,
        );
      }

      const hourVal = cellNumber(row.getCell(B.hour).value);
      const duration = Math.min(
        3,
        Math.max(1, Math.round(hourVal || 1)),
      ) as Duration;

      const createdMillis = toDateMillis(row.getCell(B.bookingDate).value) ?? Date.now();

      const rawTime = cellText(row.getCell(B.time).value);
      const t = parseTimeRange(rawTime, hourVal);
      let startTime: string;
      let endTime: string;
      if (t) {
        startTime = t.start;
        endTime = t.end;
      } else {
        startTime = "00:00";
        endTime = addHours(startTime, duration);
        warnings.push(`Sr ${sr}: could not parse time "${rawTime}"`);
      }

      const { phone, valid } = normalizePhone(cellText(row.getCell(B.contact).value));
      if (!valid) {
        warnings.push(
          `Sr ${sr}: contact "${cellText(row.getCell(B.contact).value)}" is not a 10-digit number.`,
        );
      }

      const guestCount = Math.max(1, Math.trunc(cellNumber(row.getCell(B.person).value)) || 2);
      const foodBill = cellNumber(row.getCell(B.foodBill).value);
      const roomAmount = cellNumber(row.getCell(B.totalAmount).value);
      const amount = roomAmount + foodBill;

      const advanceCash = cellNumber(row.getCell(B.advanceCash).value);
      const advanceOnline = cellNumber(row.getCell(B.advanceOnline).value);
      const balanceCash = cellNumber(row.getCell(B.balanceCash).value);
      const balanceOnline = cellNumber(row.getCell(B.balanceOnline).value);

      const payments: BookingPayment[] = [];
      if (advanceCash > 0) {
        payments.push({
          id: `${id}-ac`,
          amount: advanceCash,
          method: "cash",
          channel: "venue",
          kind: "deposit",
          at: createdMillis,
        });
      }
      if (advanceOnline > 0) {
        payments.push({
          id: `${id}-ao`,
          amount: advanceOnline,
          method: "upi",
          channel: "online",
          kind: "deposit",
          at: createdMillis,
        });
      }
      if (balanceCash > 0) {
        payments.push({
          id: `${id}-bc`,
          amount: balanceCash,
          method: "cash",
          channel: "venue",
          kind: "balance",
          at: createdMillis,
        });
      }
      if (balanceOnline > 0) {
        payments.push({
          id: `${id}-bo`,
          amount: balanceOnline,
          method: "upi",
          channel: "online",
          kind: "balance",
          at: createdMillis,
        });
      }

      const amountPaid = payments.reduce((s, p) => s + p.amount, 0);
      const paymentMethod = payments.length
        ? payments[payments.length - 1].method
        : "cash";

      const reference = cellText(row.getCell(B.reference).value);
      const status: Booking["status"] = dateISO < today ? "completed" : "confirmed";

      const booking: ImportedBooking = {
        id,
        screenId,
        date: dateISO,
        startTime,
        endTime,
        duration,
        customerName: name,
        customerPhone: phone,
        guestCount,
        addOns: {},
        amount,
        foodBill,
        amountPaid,
        paymentPlan: "full",
        payments,
        status,
        source: "offline",
        paymentMethod,
        createdAt: createdMillis,
        updatedAt: createdMillis,
        ...(reference ? { notes: `Ref: ${reference}` } : {}),
      };
      bookings.push(booking);

      totals.bookingCount += 1;
      totals.roomRevenue += roomAmount;
      totals.foodBill += foodBill;
      totals.billed += amount;
      totals.advanceCash += advanceCash;
      totals.advanceOnline += advanceOnline;
      totals.balanceCash += balanceCash;
      totals.balanceOnline += balanceOnline;
    }
    totals.collected =
      totals.advanceCash +
      totals.advanceOnline +
      totals.balanceCash +
      totals.balanceOnline;
    totals.outstanding = totals.billed - totals.collected;
  }

  // ---- Expense sheet ----
  const expenseSheet = wb.getWorksheet(EXPENSE_SHEET);
  if (!expenseSheet) {
    warnings.push(`Worksheet "${EXPENSE_SHEET}" not found.`);
  } else {
    // Duplicate guard: identical rows (same date/detail/method/amount) collapse
    // to a single entry — a repeated ledger row is never imported twice. With the
    // deterministic id + the route's add-new-only existence check, re-uploading
    // the same workbook adds nothing.
    const seenExpenseIds = new Set<string>();
    for (let r = DATA_START_ROW; r <= expenseSheet.rowCount; r++) {
      const row = expenseSheet.getRow(r);
      const outCash = cellNumber(row.getCell(E.outCash).value);
      const outOnline = cellNumber(row.getCell(E.outOnline).value);
      const detail = cellText(row.getCell(E.detail).value);

      // Only real "Out" spend; skip "In"/income-mirror rows.
      if (outCash <= 0 && outOnline <= 0) continue;

      // Savings sweeps to the HDFC account are transfers, not expenses.
      if (/to\s*hdfc/i.test(detail)) continue;
      // Opening-balance / generic transfer rows are not expenses.
      if (/opening\s*balance|transfer/i.test(detail)) {
        warnings.push(`Expense row ${r}: skipped ambiguous "${detail}".`);
        continue;
      }

      const dateISO = toDateISO(row.getCell(E.date).value);
      if (!dateISO) {
        warnings.push(`Expense row ${r}: could not parse date "${detail}" — skipped.`);
        continue;
      }
      const dateMillis = toDateMillis(row.getCell(E.date).value) ?? Date.now();
      const category = categorize(detail);

      const emit = (amount: number, method: Expense["paymentMethod"]) => {
        const hash = createHash("sha1")
          .update(`${dateISO}|${detail}|${method}|${amount}`)
          .digest("hex")
          .slice(0, 12);
        const id = `xls-e-${hash}`;
        if (seenExpenseIds.has(id)) {
          warnings.push(
            `Expense row ${r}: duplicate of an earlier identical row ("${detail}", ₹${amount}) — imported only once.`,
          );
          return;
        }
        seenExpenseIds.add(id);
        expenses.push({
          id,
          date: dateISO,
          category,
          description: detail,
          amount,
          paymentMethod: method,
          createdAt: dateMillis,
        });
        totals.expenseCount += 1;
        totals.expensesOut += amount;
      };

      if (outCash > 0) emit(outCash, "cash");
      if (outOnline > 0) emit(outOnline, "upi");
    }
  }

  return { bookings, expenses, warnings, totals };
}
