import "server-only";
import { listBookingsForExport } from "@/lib/db/bookings.server";
import { effectivePayments, emptyMethodTotals } from "@/lib/booking/payments";
import type {
  BookingPaymentMethod,
  BookingStatus,
  PaymentChannel,
  PaymentKind,
  ScreenId,
} from "@/types";

// A flat, chronological view of every payment received — the "every payment
// monitored" ledger behind /admin/payments. Each ledger entry is paired with
// its booking's context. Rows are attributed to the booking `date` for period
// filtering, so the totals here reconcile with the accounting page; the `at`
// timestamp is kept for chronological ordering and display.

const REVENUE_STATUSES: ReadonlySet<BookingStatus> = new Set([
  "confirmed",
  "completed",
]);

export type PaymentLedgerRow = {
  paymentId: string;
  bookingId: string;
  customerName: string;
  customerPhone: string;
  screenId: ScreenId;
  bookingStatus: BookingStatus;
  /** Booking date (yyyy-mm-dd) — used for period filtering. */
  date: string;
  /** When the payment was received (epoch ms; 0 if unknown for legacy data). */
  at: number;
  amount: number;
  method: BookingPaymentMethod;
  channel: PaymentChannel;
  kind: PaymentKind;
  note?: string;
};

export type PaymentLedgerFilters = {
  dateFrom?: string;
  dateTo?: string;
  method?: BookingPaymentMethod;
};

export type PaymentLedgerResult = {
  rows: PaymentLedgerRow[];
  total: number;
  byMethod: Record<BookingPaymentMethod, number>;
  count: number;
};

export async function listPaymentsLedger(
  filters: PaymentLedgerFilters,
): Promise<PaymentLedgerResult> {
  const bookings = await listBookingsForExport({});
  const rows: PaymentLedgerRow[] = [];

  for (const b of bookings) {
    if (!REVENUE_STATUSES.has(b.status)) continue;
    if (filters.dateFrom && b.date < filters.dateFrom) continue;
    if (filters.dateTo && b.date > filters.dateTo) continue;
    for (const p of effectivePayments(b)) {
      if (filters.method && p.method !== filters.method) continue;
      rows.push({
        paymentId: p.id,
        bookingId: b.id,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        screenId: b.screenId,
        bookingStatus: b.status,
        date: b.date,
        at: p.at,
        amount: p.amount,
        method: p.method,
        channel: p.channel,
        kind: p.kind,
        ...(p.note ? { note: p.note } : {}),
      });
    }
  }

  // Newest first: by payment time, then by booking date.
  rows.sort((a, b) => b.at - a.at || b.date.localeCompare(a.date));

  const byMethod = emptyMethodTotals();
  let total = 0;
  for (const r of rows) {
    byMethod[r.method] += r.amount;
    total += r.amount;
  }

  return { rows, total, byMethod, count: rows.length };
}
