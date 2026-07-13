import { type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import {
  listBookingsForExport,
  type BookingListFilters,
} from "@/lib/db/bookings.server";
import { buildBookingsWorkbook } from "@/lib/export/bookingsWorkbook";
import { buildBookingsPdf } from "@/lib/export/bookingsPdf";
import { SCREEN_LABEL } from "@/components/admin/dashboard/utils";
import type { BookingSource, BookingStatus, ScreenId } from "@/types";

export const runtime = "nodejs";

// Mirrors parseFilters in src/app/admin/(protected)/bookings/page.tsx so the
// export reflects exactly the same filtered set the admin is looking at.
function parseFilters(sp: URLSearchParams): BookingListFilters {
  const screen = sp.get("screen") as ScreenId | null;
  const status = sp.get("status") as BookingStatus | null;
  const source = sp.get("source") as BookingSource | null;
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
    dateFrom: sp.get("from") ?? undefined,
    dateTo: sp.get("to") ?? undefined,
    query: sp.get("q") ?? undefined,
  };
}

function subtitleFor(
  filters: BookingListFilters,
  count: number,
): string {
  const parts: string[] = [];
  if (filters.screenId) parts.push(SCREEN_LABEL[filters.screenId]);
  if (filters.status) parts.push(`Status: ${filters.status}`);
  if (filters.source) parts.push(`Source: ${filters.source}`);
  if (filters.dateFrom || filters.dateTo) {
    parts.push(`${filters.dateFrom ?? "…"} → ${filters.dateTo ?? "…"}`);
  }
  if (filters.query) parts.push(`Search: “${filters.query}”`);
  parts.push(`${count} booking${count === 1 ? "" : "s"}`);
  return parts.join("  ·  ");
}

export async function GET(req: NextRequest) {
  await requireAdmin();

  const sp = req.nextUrl.searchParams;
  const filters = parseFilters(sp);
  const format = sp.get("format") === "pdf" ? "pdf" : "xlsx";
  const rows = await listBookingsForExport(filters);
  const stamp = new Date().toISOString().slice(0, 10);
  const subtitle = subtitleFor(filters, rows.length);

  if (format === "pdf") {
    const buffer = await buildBookingsPdf(rows, {
      title: "Bookings",
      subtitle,
    });
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="bookings-${stamp}.pdf"`,
      },
    });
  }

  const buffer = await buildBookingsWorkbook(rows, {
    title: "Bookings",
    subtitle,
  });
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="bookings-${stamp}.xlsx"`,
    },
  });
}
