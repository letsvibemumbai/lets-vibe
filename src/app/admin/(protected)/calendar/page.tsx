import { format } from "date-fns";
import {
  getBookingsForMonth,
  todayString,
} from "@/lib/db/bookings.server";
import { AdminCalendar } from "@/components/admin/calendar/AdminCalendar";

export const metadata = { title: "Calendar · Let's Vibe Admin" };
export const dynamic = "force-dynamic";

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const monthParam = typeof sp.month === "string" ? sp.month : undefined;
  const today = todayString();
  const now = monthParam
    ? new Date(`${monthParam}-01T00:00:00`)
    : new Date(`${today}T00:00:00`);
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const bookings = await getBookingsForMonth(year, month);
  const initialMonth = format(now, "yyyy-MM");

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header>
        <h1 className="font-display text-4xl text-foreground">Calendar</h1>
        <p className="mt-1 text-sm text-foreground/55">
          Month view across all screens. Click a chip for a booking, or a day
          to see everything on it.
        </p>
      </header>
      <AdminCalendar
        initialMonth={initialMonth}
        today={today}
        bookings={bookings}
      />
    </div>
  );
}
