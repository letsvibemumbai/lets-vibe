import Link from "next/link";
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { BookingsFilters } from "@/components/admin/bookings/Filters";
import { BookingsTable } from "@/components/admin/bookings/BookingsTable";
import {
  listBookings,
  type BookingListFilters,
} from "@/lib/db/bookings.server";
import type {
  BookingSource,
  BookingStatus,
  ScreenId,
} from "@/types";

export const metadata = { title: "Bookings · Let's Vibe Admin" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type SP = Record<string, string | string[] | undefined>;
function pick(sp: SP, key: string): string | undefined {
  const v = sp[key];
  if (Array.isArray(v)) return v[0];
  return v;
}

function parseFilters(sp: SP): BookingListFilters {
  const screen = pick(sp, "screen") as ScreenId | undefined;
  const status = pick(sp, "status") as BookingStatus | undefined;
  const source = pick(sp, "source") as BookingSource | undefined;
  return {
    screenId:
      screen === "beach" || screen === "grass" || screen === "forest"
        ? screen
        : undefined,
    status:
      status === "pending" ||
      status === "confirmed" ||
      status === "completed" ||
      status === "cancelled"
        ? status
        : undefined,
    source:
      source === "online" || source === "offline" ? source : undefined,
    dateFrom: pick(sp, "from"),
    dateTo: pick(sp, "to"),
    query: pick(sp, "q"),
  };
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const page = Math.max(1, Number(pick(sp, "page") ?? 1) || 1);
  const result = await listBookings(filters, page, PAGE_SIZE);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl text-foreground">Bookings</h1>
          <p className="mt-1 text-sm text-foreground/55">
            {result.total} total · page {result.page} of {result.pageCount}
          </p>
        </div>
        <Link
          href="/admin/bookings/new"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-transform hover:scale-[1.03]"
        >
          <CalendarPlus className="h-4 w-4" />
          New offline booking
        </Link>
      </header>

      <BookingsFilters
        screen={filters.screenId}
        status={filters.status}
        source={filters.source}
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        query={filters.query}
      />

      <BookingsTable rows={result.rows} filters={filters} />

      <Pagination page={result.page} pageCount={result.pageCount} sp={sp} />
    </div>
  );
}

function Pagination({
  page,
  pageCount,
  sp,
}: {
  page: number;
  pageCount: number;
  sp: SP;
}) {
  if (pageCount <= 1) return null;
  function pageHref(p: number) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (typeof v === "string") params.set(k, v);
      else if (Array.isArray(v) && v[0]) params.set(k, v[0]);
    }
    params.set("page", String(p));
    return `?${params.toString()}`;
  }
  return (
    <nav className="flex items-center justify-end gap-2">
      <PageLink
        href={pageHref(Math.max(1, page - 1))}
        disabled={page <= 1}
        label="Previous"
        icon={<ChevronLeft className="h-3.5 w-3.5" />}
      />
      <span className="text-sm text-foreground/60">
        {page} / {pageCount}
      </span>
      <PageLink
        href={pageHref(Math.min(pageCount, page + 1))}
        disabled={page >= pageCount}
        label="Next"
        icon={<ChevronRight className="h-3.5 w-3.5" />}
        iconRight
      />
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  label,
  icon,
  iconRight,
}: {
  href: string;
  disabled: boolean;
  label: string;
  icon: React.ReactNode;
  iconRight?: boolean;
}) {
  const className =
    "inline-flex h-9 items-center gap-1.5 rounded-full bg-card px-3 text-sm font-medium ring-1 ring-hairline hover:bg-cream";
  if (disabled) {
    return (
      <span
        aria-disabled
        className={`${className} pointer-events-none opacity-40`}
      >
        {!iconRight && icon}
        {label}
        {iconRight && icon}
      </span>
    );
  }
  return (
    <Link href={href} className={className}>
      {!iconRight && icon}
      {label}
      {iconRight && icon}
    </Link>
  );
}
