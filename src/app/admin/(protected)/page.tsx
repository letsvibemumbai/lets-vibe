import { format, parseISO } from "date-fns";
import {
  getDashboardData,
  revenueByDayForMonth,
} from "@/lib/admin/dashboard.server";
import { AutoRefresh } from "@/components/admin/dashboard/AutoRefresh";
import { StatsRow } from "@/components/admin/dashboard/StatsRow";
import { TodayScheduleCard } from "@/components/admin/dashboard/TodayScheduleCard";
import { MonthCalendarCard } from "@/components/admin/dashboard/MonthCalendarCard";
import { RecentBookingsCard } from "@/components/admin/dashboard/RecentBookingsCard";
import { RevenueChartCard } from "@/components/admin/dashboard/RevenueChartCard";
import { QuickActions } from "@/components/admin/dashboard/QuickActions";

export const metadata = { title: "Dashboard · Let's Vibe Admin" };

// Bookings change frequently; let revalidatePath() and the AutoRefresh client
// keep this fresh rather than caching it.
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const data = await getDashboardData();
  const revenueData = revenueByDayForMonth(
    data.monthStart,
    data.monthEnd,
    data.monthBookings,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <AutoRefresh />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
            Welcome back
          </span>
          <h1
            className="mt-2 font-display text-4xl leading-none tracking-[-0.01em] text-foreground sm:text-5xl"
            style={{ fontWeight: 400 }}
          >
            Dashboard
          </h1>
          <p className="mt-3 text-[13px] text-foreground/55">
            {format(parseISO(data.today), "EEEE, d MMMM yyyy")}
          </p>
        </div>
        <QuickActions />
      </header>

      <StatsRow
        today={data.stats.today}
        week={data.stats.week}
        month={data.stats.month}
        pendingCount={data.stats.pendingOverdue.length}
      />

      <TodayScheduleCard bookings={data.todayBookings} />

      <div className="grid gap-6 lg:grid-cols-2">
        <MonthCalendarCard today={data.today} bookings={data.monthBookings} />
        <RevenueChartCard data={revenueData} />
      </div>

      <RecentBookingsCard bookings={data.recentBookings} />
    </div>
  );
}
