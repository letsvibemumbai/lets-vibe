import "server-only";
import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import {
  getBookingsInRange,
  getRecentBookings,
  getTodayBookings,
  timestampToMillis,
  todayString,
} from "@/lib/db/bookings.server";
import { roomRevenue } from "@/lib/booking/revenue";
import type { Booking, BookingStatus } from "@/types";

export type Totals = { count: number; revenue: number };

const REVENUE_STATUSES: ReadonlySet<BookingStatus> = new Set([
  "confirmed",
  "completed",
]);

const PENDING_AGE_MS = 30 * 60 * 1000;

function isoDay(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function totalsFor(bookings: Booking[]): Totals {
  let revenue = 0;
  // Room income (the Excel's "Income"): the booking's value minus food + add-ons.
  // Food and add-ons are broken out on the accounting page.
  for (const b of bookings) {
    if (REVENUE_STATUSES.has(b.status)) revenue += roomRevenue(b);
  }
  return { count: bookings.length, revenue };
}

export type DashboardData = {
  today: string;
  monthStart: string;
  monthEnd: string;
  stats: {
    today: Totals;
    week: Totals;
    month: Totals;
    pendingOverdue: Booking[];
  };
  todayBookings: Booking[];
  monthBookings: Booking[];
  recentBookings: Booking[];
};

// One coordinated fetch for the entire dashboard so all cards share consistent
// data and we minimize round trips. The page passes slices to each card.
export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date();
  const today = todayString();
  const weekStart = isoDay(startOfWeek(now, { weekStartsOn: 1 }));
  const weekEnd = isoDay(endOfWeek(now, { weekStartsOn: 1 }));
  const monthStart = isoDay(startOfMonth(now));
  const monthEnd = isoDay(endOfMonth(now));

  // The month range covers today and the week (since "today" is always within
  // the current month or week range we query). We fetch month + week + today
  // independently rather than reusing slices to keep the queries simple.
  const [todayBookings, weekBookings, monthBookings, recentBookings] =
    await Promise.all([
      getTodayBookings(),
      getBookingsInRange(weekStart, weekEnd),
      getBookingsInRange(monthStart, monthEnd),
      getRecentBookings(10),
    ]);

  const cutoff = now.getTime() - PENDING_AGE_MS;
  const pendingOverdue = monthBookings.filter(
    (b) => b.status === "pending" && timestampToMillis(b.createdAt) < cutoff,
  );

  return {
    today,
    monthStart,
    monthEnd,
    stats: {
      today: totalsFor(todayBookings),
      week: totalsFor(weekBookings),
      month: totalsFor(monthBookings),
      pendingOverdue,
    },
    todayBookings,
    monthBookings,
    recentBookings,
  };
}

export function revenueByDayForMonth(
  monthStart: string,
  monthEnd: string,
  bookings: Booking[],
): { date: string; revenue: number }[] {
  const start = new Date(`${monthStart}T00:00:00`);
  const end = new Date(`${monthEnd}T00:00:00`);
  const days: { date: string; revenue: number }[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push({ date: isoDay(d), revenue: 0 });
  }
  const byDate = new Map(days.map((d) => [d.date, d]));
  for (const b of bookings) {
    if (!REVENUE_STATUSES.has(b.status)) continue;
    const slot = byDate.get(b.date);
    if (slot) slot.revenue += roomRevenue(b);
  }
  return days;
}

export function countsByDay(bookings: Booking[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const b of bookings) {
    if (b.status === "cancelled") continue;
    m.set(b.date, (m.get(b.date) ?? 0) + 1);
  }
  return m;
}
