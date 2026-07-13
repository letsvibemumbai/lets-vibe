import "server-only";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";
import { getBookingsInRange } from "@/lib/db/bookings.server";
import { getExpensesInRange } from "@/lib/db/expenses.server";
import { SCREEN_IDS } from "@/lib/booking/constants";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABEL,
  collectedByMethod as bookingCollectedByMethod,
  emptyMethodTotals,
  totalCollected as bookingTotalCollected,
} from "@/lib/booking/payments";
import {
  addOnsTotal,
  foodRevenue,
  roomRevenue,
} from "@/lib/booking/revenue";
import type {
  Booking,
  BookingPaymentMethod,
  BookingSource,
  Duration,
  Expense,
  ExpenseCategory,
  ScreenId,
} from "@/types";

const REVENUE_STATUSES = new Set<Booking["status"]>(["confirmed", "completed"]);
export const EXPENSE_CATEGORIES: readonly ExpenseCategory[] = [
  "utilities",
  "staff",
  "supplies",
  "maintenance",
  "marketing",
  "other",
];

export type Bucket<K extends string> = { key: K; label: string; value: number };

// Billed revenue (accrual): the full value of a confirmed/completed booking,
// regardless of how much has been collected. For all legacy data this equals
// the old `amountPaid || amount` (amountPaid was always 0 or full), so existing
// totals are unchanged; for new 50%-deposit bookings it correctly counts the
// whole bill rather than just the deposit. "Collected" (below) tracks the cash
// actually in hand, split by tender.
function revenueOf(b: Booking): number {
  return b.amount;
}

function isRevenue(b: Booking): boolean {
  return REVENUE_STATUSES.has(b.status);
}

const SCREEN_LABEL: Record<ScreenId, string> = {
  beach: "The Beach Shack",
  grass: "Love Den",
  forest: "Nature Paradise",
};

const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  utilities: "Utilities",
  staff: "Staff",
  supplies: "Supplies",
  maintenance: "Maintenance",
  marketing: "Marketing",
  other: "Other",
};

function bucketsForScreens(bookings: Booking[]): Bucket<ScreenId>[] {
  const totals: Record<ScreenId, number> = { beach: 0, grass: 0, forest: 0 };
  for (const b of bookings) {
    if (!isRevenue(b)) continue;
    totals[b.screenId] += revenueOf(b);
  }
  return SCREEN_IDS.map((id) => ({
    key: id,
    label: SCREEN_LABEL[id],
    value: totals[id],
  }));
}

function bucketsForSources(bookings: Booking[]): Bucket<BookingSource>[] {
  const totals: Record<BookingSource, number> = { online: 0, offline: 0 };
  for (const b of bookings) {
    if (!isRevenue(b)) continue;
    totals[b.source] += revenueOf(b);
  }
  return (["online", "offline"] as BookingSource[]).map((k) => ({
    key: k,
    label: k === "online" ? "Online" : "Offline",
    value: totals[k],
  }));
}

function bucketsForDurations(bookings: Booking[]): Bucket<string>[] {
  const totals: Record<Duration, number> = { 1: 0, 2: 0, 3: 0 };
  const counts: Record<Duration, number> = { 1: 0, 2: 0, 3: 0 };
  for (const b of bookings) {
    if (!isRevenue(b)) continue;
    totals[b.duration] += revenueOf(b);
    counts[b.duration] += 1;
  }
  return ([1, 2, 3] as Duration[]).map((d) => ({
    key: `${d}h`,
    label: `${d} hour${d > 1 ? "s" : ""} (${counts[d]} bookings)`,
    value: totals[d],
  }));
}

function bucketsForCategories(
  expenses: Expense[],
): Bucket<ExpenseCategory>[] {
  const totals: Record<ExpenseCategory, number> = {
    utilities: 0,
    staff: 0,
    supplies: 0,
    maintenance: 0,
    marketing: 0,
    other: 0,
  };
  for (const e of expenses) {
    totals[e.category] += e.amount;
  }
  return EXPENSE_CATEGORIES.map((c) => ({
    key: c,
    label: CATEGORY_LABEL[c],
    value: totals[c],
  }));
}

// Collected cash, split by tender (UPI / Cash / Online / Card / Bank). Counts
// only revenue-status bookings (confirmed/completed), so refunded-cancelled
// money is excluded — consistent with the rest of the P&L.
function bucketsForMethods(
  bookings: Booking[],
): Bucket<BookingPaymentMethod>[] {
  const totals = emptyMethodTotals();
  for (const b of bookings) {
    if (!isRevenue(b)) continue;
    const m = bookingCollectedByMethod(b);
    for (const k of PAYMENT_METHODS) totals[k] += m[k];
  }
  return PAYMENT_METHODS.map((k) => ({
    key: k,
    label: PAYMENT_METHOD_LABEL[k],
    value: totals[k],
  }));
}

export type CollectionSummary = {
  /** Per-tender collected totals, in canonical order. */
  byMethod: Bucket<BookingPaymentMethod>[];
  /** Total cash actually collected across all tenders. */
  totalCollected: number;
  /** Billed revenue (full value of confirmed/completed bookings). */
  billedRevenue: number;
  /** Room-only revenue — the Excel's "Income" (billed − food − add-ons). */
  roomRevenue: number;
  /** Food-bill revenue. */
  foodRevenue: number;
  /** À-la-carte add-on / package revenue. */
  addOnRevenue: number;
  /** Still owed: billed − collected (never negative). */
  outstanding: number;
};

export async function getCollectionSummary(
  start: string,
  end: string,
): Promise<CollectionSummary> {
  const bookings = await getBookingsInRange(start, end);
  return collectionSummaryFor(bookings);
}

function collectionSummaryFor(bookings: Booking[]): CollectionSummary {
  const revenueBookings = bookings.filter(isRevenue);
  const totalCollected = revenueBookings.reduce(
    (s, b) => s + bookingTotalCollected(b),
    0,
  );
  const billedRevenue = revenueBookings.reduce((s, b) => s + revenueOf(b), 0);
  const room = revenueBookings.reduce((s, b) => s + roomRevenue(b), 0);
  const food = revenueBookings.reduce((s, b) => s + foodRevenue(b), 0);
  const addOn = revenueBookings.reduce((s, b) => s + addOnsTotal(b), 0);
  return {
    byMethod: bucketsForMethods(bookings),
    totalCollected,
    billedRevenue,
    roomRevenue: room,
    foodRevenue: food,
    addOnRevenue: addOn,
    outstanding: Math.max(0, billedRevenue - totalCollected),
  };
}

export async function getRevenueByScreen(
  start: string,
  end: string,
): Promise<Bucket<ScreenId>[]> {
  const bookings = await getBookingsInRange(start, end);
  return bucketsForScreens(bookings);
}

export async function getRevenueBySource(
  start: string,
  end: string,
): Promise<Bucket<BookingSource>[]> {
  const bookings = await getBookingsInRange(start, end);
  return bucketsForSources(bookings);
}

export async function getRevenueByDuration(
  start: string,
  end: string,
): Promise<Bucket<string>[]> {
  const bookings = await getBookingsInRange(start, end);
  return bucketsForDurations(bookings);
}

export async function getExpensesByCategory(
  start: string,
  end: string,
): Promise<Bucket<ExpenseCategory>[]> {
  const expenses = await getExpensesInRange(start, end);
  return bucketsForCategories(expenses);
}

export type DailyTotals = {
  date: string;
  revenue: number;
  bookings: number;
  expenses: number;
};

export async function getDailyTotals(
  start: string,
  end: string,
): Promise<DailyTotals[]> {
  const [bookings, expenses] = await Promise.all([
    getBookingsInRange(start, end),
    getExpensesInRange(start, end),
  ]);
  return dailyTotalsFor(start, end, bookings, expenses);
}

function dailyTotalsFor(
  start: string,
  end: string,
  bookings: Booking[],
  expenses: Expense[],
): DailyTotals[] {
  const days = eachDayOfInterval({
    start: parseISO(start),
    end: parseISO(end),
  }).map((d) => format(d, "yyyy-MM-dd"));
  const map = new Map<string, DailyTotals>(
    days.map((d) => [d, { date: d, revenue: 0, bookings: 0, expenses: 0 }]),
  );
  for (const b of bookings) {
    const slot = map.get(b.date);
    if (!slot) continue;
    if (isRevenue(b)) {
      slot.revenue += revenueOf(b);
      slot.bookings += 1;
    }
  }
  for (const e of expenses) {
    const slot = map.get(e.date);
    if (slot) slot.expenses += e.amount;
  }
  return days.map((d) => map.get(d)!);
}

export type MonthlyReport = {
  year: number;
  month: number;
  start: string;
  end: string;
  totals: {
    revenue: number;
    roomRevenue: number;
    foodRevenue: number;
    addOnRevenue: number;
    expenses: number;
    net: number;
    bookingCount: number;
    expenseCount: number;
    collected: number;
    outstanding: number;
  };
  revenueByScreen: Bucket<ScreenId>[];
  revenueBySource: Bucket<BookingSource>[];
  revenueByDuration: Bucket<string>[];
  collectedByMethod: Bucket<BookingPaymentMethod>[];
  expensesByCategory: Bucket<ExpenseCategory>[];
  daily: DailyTotals[];
  bookings: Booking[];
  expenses: Expense[];
};

export async function getMonthlyReport(
  year: number,
  month: number,
): Promise<MonthlyReport> {
  const start = format(startOfMonth(new Date(year, month - 1, 1)), "yyyy-MM-dd");
  const end = format(endOfMonth(new Date(year, month - 1, 1)), "yyyy-MM-dd");
  const [bookings, expenses] = await Promise.all([
    getBookingsInRange(start, end),
    getExpensesInRange(start, end),
  ]);
  const revenue = bookings
    .filter(isRevenue)
    .reduce((sum, b) => sum + revenueOf(b), 0);
  const expenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const collection = collectionSummaryFor(bookings);

  return {
    year,
    month,
    start,
    end,
    totals: {
      revenue,
      roomRevenue: collection.roomRevenue,
      foodRevenue: collection.foodRevenue,
      addOnRevenue: collection.addOnRevenue,
      expenses: expenseTotal,
      net: revenue - expenseTotal,
      bookingCount: bookings.filter(isRevenue).length,
      expenseCount: expenses.length,
      collected: collection.totalCollected,
      outstanding: collection.outstanding,
    },
    revenueByScreen: bucketsForScreens(bookings),
    revenueBySource: bucketsForSources(bookings),
    revenueByDuration: bucketsForDurations(bookings),
    collectedByMethod: collection.byMethod,
    expensesByCategory: bucketsForCategories(expenses),
    daily: dailyTotalsFor(start, end, bookings, expenses),
    bookings: bookings
      .slice()
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          a.startTime.localeCompare(b.startTime),
      ),
    expenses: expenses
      .slice()
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          a.category.localeCompare(b.category),
      ),
  };
}
