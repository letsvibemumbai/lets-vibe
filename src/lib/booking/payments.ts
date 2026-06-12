import type {
  Booking,
  BookingPayment,
  BookingPaymentMethod,
  PaymentPlan,
} from "@/types";

/**
 * Pure payment math shared by client and server. The booking's `payments`
 * ledger is the single source of truth for how much was collected and via
 * which tender; everything here derives from it (or bridges legacy bookings
 * that predate the ledger).
 */

/** The deposit is always half the bill (locked product decision). */
export const DEPOSIT_PERCENT = 50;

/** Tenders we surface as separate balances, in display order. */
export const PAYMENT_METHODS: readonly BookingPaymentMethod[] = [
  "upi",
  "cash",
  "razorpay",
  "card",
  "bank",
];

export const PAYMENT_METHOD_LABEL: Record<BookingPaymentMethod, string> = {
  upi: "UPI",
  cash: "Cash",
  razorpay: "Online (Razorpay)",
  card: "Card",
  bank: "Bank",
};

/** Deposit owed for a given total, rounded to whole rupees. */
export function depositAmount(total: number): number {
  return Math.round((total * DEPOSIT_PERCENT) / 100);
}

/** The remainder after the deposit (so deposit + balance === total exactly). */
export function balanceAmount(total: number): number {
  return Math.max(0, total - depositAmount(total));
}

/** What the online gateway should capture for the chosen plan. */
export function onlinePortion(total: number, plan: PaymentPlan): number {
  return plan === "deposit" ? depositAmount(total) : total;
}

/**
 * The ledger for a booking. Uses `booking.payments` when present; otherwise
 * bridges a legacy booking by synthesizing a single entry from `amountPaid`
 * (+ `paymentMethod` / `source`), so historical bookings still appear in the
 * per-tender breakdowns. Returns an empty list when nothing was collected.
 */
export function effectivePayments(booking: Booking): BookingPayment[] {
  if (booking.payments && booking.payments.length > 0) return booking.payments;
  if (booking.payments && booking.payments.length === 0) return [];
  const paid = booking.amountPaid ?? 0;
  if (paid <= 0) return [];
  const method: BookingPaymentMethod =
    booking.paymentMethod ?? (booking.source === "online" ? "razorpay" : "cash");
  return [
    {
      id: "legacy",
      amount: paid,
      method,
      channel: booking.source === "online" ? "online" : "venue",
      kind: paid >= booking.amount ? "full" : "deposit",
      at:
        typeof booking.createdAt === "number" && booking.createdAt > 0
          ? booking.createdAt
          : 0,
    },
  ];
}

/** Total collected so far across every tender. */
export function totalCollected(booking: Booking): number {
  return effectivePayments(booking).reduce((sum, p) => sum + p.amount, 0);
}

/** Balance still owed at the venue (never negative). */
export function balanceDue(booking: Booking): number {
  return Math.max(0, booking.amount - totalCollected(booking));
}

/** Empty per-method tally, in the canonical method order. */
export function emptyMethodTotals(): Record<BookingPaymentMethod, number> {
  return { upi: 0, cash: 0, razorpay: 0, card: 0, bank: 0 };
}

/** How much of this booking was collected per tender. */
export function collectedByMethod(
  booking: Booking,
): Record<BookingPaymentMethod, number> {
  const totals = emptyMethodTotals();
  for (const p of effectivePayments(booking)) {
    totals[p.method] += p.amount;
  }
  return totals;
}

/** Recompute the cached `amountPaid` from a ledger. */
export function sumPayments(payments: BookingPayment[]): number {
  return payments.reduce((sum, p) => sum + p.amount, 0);
}
