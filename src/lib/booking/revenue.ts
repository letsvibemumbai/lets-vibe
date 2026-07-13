import type { Booking } from "@/types";

/**
 * Revenue breakdown of a booking's billed `amount`, mirroring the owner's Excel:
 * `amount` = room + food + à-la-carte add-ons. "Income" is the room portion.
 * Pure — no I/O, unit-testable. Used by the analytics aggregates.
 */

/** Sum of à-la-carte add-on / package selections on a booking. */
export function addOnsTotal(b: Pick<Booking, "addOns">): number {
  return (b.addOns?.selections ?? []).reduce(
    (sum, sel) => sum + sel.unitPrice * sel.quantity,
    0,
  );
}

/** The food portion of the bill (absent ⇒ 0). */
export function foodRevenue(b: Pick<Booking, "foodBill">): number {
  return b.foodBill ?? 0;
}

/** Room revenue — the Excel's "Income": billed total minus food and add-ons. */
export function roomRevenue(
  b: Pick<Booking, "amount" | "foodBill" | "addOns">,
): number {
  return Math.max(0, b.amount - foodRevenue(b) - addOnsTotal(b));
}
