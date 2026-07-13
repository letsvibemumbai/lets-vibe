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

const PAGE_SIZES = [20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 20;

function parsePageSize(raw: string | undefined): number {
  const n = Number(raw);
  return (PAGE_SIZES as readonly number[]).includes(n) ? n : DEFAULT_PAGE_SIZE;
}

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
  const pageSize = parsePageSize(pick(sp, "size"));
  const result = await listBookings(filters, page, pageSize);

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

      <nav className="flex flex-wrap items-center justify-between gap-3">
        <PageSizeSelector current={pageSize} sp={sp} />
        <Pagination
          page={result.page}
          pageCount={result.pageCount}
          sp={sp}
        />
      </nav>
    </div>
  );
}

// Shared query-string builder: clone every current search param, then apply the
// given overrides (a null value removes the key). Keeps filters + size intact
// across page/size navigation.
function hrefWith(sp: SP, overrides: Record<string, string | null>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") params.set(k, v);
    else if (Array.isArray(v) && v[0]) params.set(k, v[0]);
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v === null) params.delete(k);
    else params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "?";
}

function PageSizeSelector({ current, sp }: { current: number; sp: SP }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-foreground/55">Per page:</span>
      <div className="flex items-center gap-1.5">
        {PAGE_SIZES.map((size) => {
          const active = size === current;
          // Changing page size resets to page 1 so the window stays valid.
          const href = hrefWith(sp, { size: String(size), page: "1" });
          return (
            <Link
              key={size}
              href={href}
              aria-current={active ? "true" : undefined}
              className={
                active
                  ? "inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-accent px-3 text-sm font-semibold text-accent-foreground"
                  : "inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-card px-3 text-sm font-medium ring-1 ring-hairline hover:bg-cream"
              }
            >
              {size}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Numbered page window: always first + last, plus current ±2, with "…" markers
// for the gaps. Returns page numbers interleaved with the sentinel -1 (ellipsis).
function pageWindow(page: number, pageCount: number): number[] {
  const pages = new Set<number>([1, pageCount, page]);
  for (let d = 1; d <= 2; d++) {
    if (page - d >= 1) pages.add(page - d);
    if (page + d <= pageCount) pages.add(page + d);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const out: number[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push(-1); // ellipsis
    out.push(p);
    prev = p;
  }
  return out;
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
  const pageHref = (p: number) => hrefWith(sp, { page: String(p) });
  const window = pageWindow(page, pageCount);

  return (
    <div className="flex items-center gap-1.5">
      <ArrowLink
        href={pageHref(page - 1)}
        disabled={page <= 1}
        label="Previous page"
        icon={<ChevronLeft className="h-3.5 w-3.5" />}
      />
      {window.map((p, i) =>
        p === -1 ? (
          <span
            key={`gap-${i}`}
            className="inline-flex h-9 min-w-9 items-center justify-center px-1 text-sm text-foreground/40"
            aria-hidden
          >
            …
          </span>
        ) : (
          <NumberLink key={p} href={pageHref(p)} page={p} active={p === page} />
        ),
      )}
      <ArrowLink
        href={pageHref(page + 1)}
        disabled={page >= pageCount}
        label="Next page"
        icon={<ChevronRight className="h-3.5 w-3.5" />}
      />
    </div>
  );
}

function NumberLink({
  href,
  page,
  active,
}: {
  href: string;
  page: number;
  active: boolean;
}) {
  const className = active
    ? "inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-accent px-3 text-sm font-semibold text-accent-foreground"
    : "inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-card px-3 text-sm font-medium ring-1 ring-hairline hover:bg-cream";
  if (active) {
    return (
      <span aria-current="page" className={className}>
        {page}
      </span>
    );
  }
  return (
    <Link href={href} className={className}>
      {page}
    </Link>
  );
}

function ArrowLink({
  href,
  disabled,
  label,
  icon,
}: {
  href: string;
  disabled: boolean;
  label: string;
  icon: React.ReactNode;
}) {
  const className =
    "inline-flex h-9 w-9 items-center justify-center rounded-full bg-card text-sm font-medium ring-1 ring-hairline hover:bg-cream";
  if (disabled) {
    return (
      <span
        aria-disabled
        aria-label={label}
        className={`${className} pointer-events-none opacity-40`}
      >
        {icon}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={className}>
      {icon}
    </Link>
  );
}
