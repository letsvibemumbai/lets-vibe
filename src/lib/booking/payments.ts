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

/**
 * Compute the payment ledger after an admin verifies a UPI booking's screenshot.
 * Records the online portion (the full bill, or the 50% deposit if that plan was
 * chosen) as a UPI payment on top of any existing entries, and returns the new
 * ledger + cached `amountPaid`. Pure — the caller supplies the new entry's id +
 * timestamp so the result is deterministic and unit-testable. No amount is
 * computed from a rate: `captured` is sliced straight from the booking total.
 */
export function applyUpiConfirmation(
  booking: Booking,
  entry: { id: string; at: number },
): { payments: BookingPayment[]; amountPaid: number; captured: number } {
  const plan = booking.paymentPlan ?? "full";
  const captured = onlinePortion(booking.amount, plan);
  const existing = effectivePayments(booking);
  const payment: BookingPayment = {
    id: entry.id,
    amount: captured,
    method: "upi",
    channel: "online",
    kind: plan === "deposit" ? "deposit" : "full",
    at: entry.at,
    note: "UPI payment verified from uploaded screenshot",
  };
  const payments = [...existing, payment];
  return { payments, amountPaid: sumPayments(payments), captured };
}

/**
 * Build a UPI deep-link (`upi://pay?…`) so a customer on a phone can tap to open
 * GPay/PhonePe/Paytm with the payee + amount pre-filled. Returns `null` when no
 * VPA is configured (we then fall back to the scan-only static QR image).
 * This only constructs a link — no money is computed; `amount` is passed
 * straight through from the bill.
 */
export function buildUpiUri(args: {
  vpa?: string;
  payeeName?: string;
  amount?: number;
  note?: string;
}): string | null {
  const vpa = args.vpa?.trim();
  if (!vpa) return null;
  const params = new URLSearchParams({ pa: vpa, cu: "INR" });
  if (args.payeeName?.trim()) params.set("pn", args.payeeName.trim());
  if (typeof args.amount === "number" && args.amount > 0) {
    params.set("am", String(args.amount));
  }
  if (args.note?.trim()) params.set("tn", args.note.trim());
  return `upi://pay?${params.toString()}`;
}
