import type { Booking, Duration, Screen } from "@/types";

/**
 * Compute the total price of a booking. Sums the duration's base price plus
 * each selection's unitPrice × quantity from the dynamic add-on catalogue.
 */
export function calculateBookingPrice(
  screen: Screen,
  duration: Duration,
  addOns: Booking["addOns"],
): number {
  let total = screen.basePrices[`${duration}h` as `${Duration}h`];
  if (addOns.selections) {
    for (const sel of addOns.selections) {
      const qty = Math.max(0, Math.round(sel.quantity));
      total += sel.unitPrice * qty;
    }
  }
  return total;
}

/**
 * Apply a flat membership discount to a gross amount. Returns the rounded
 * discount and the net payable. A 0% or non-positive percent yields no
 * discount.
 */
export function applyMembershipDiscount(
  amount: number,
  discountPercent: number,
): { net: number; discount: number } {
  if (discountPercent <= 0) return { net: amount, discount: 0 };
  const discount = Math.round((amount * discountPercent) / 100);
  return { net: Math.max(0, amount - discount), discount };
}
