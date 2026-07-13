import { describe, expect, it } from "vitest";
import { addOnsTotal, foodRevenue, roomRevenue } from "./revenue";
import type { Booking } from "@/types";

function b(partial: Partial<Booking>): Booking {
  return { amount: 0, amountPaid: 0, addOns: {}, ...partial } as Booking;
}

describe("revenue breakdown", () => {
  it("imported booking: room = amount - foodBill (no add-ons)", () => {
    const x = b({ amount: 6944, foodBill: 2444 });
    expect(foodRevenue(x)).toBe(2444);
    expect(addOnsTotal(x)).toBe(0);
    expect(roomRevenue(x)).toBe(4500);
  });

  it("app booking: room = amount - add-ons (no food)", () => {
    const x = b({
      amount: 4500,
      addOns: {
        selections: [
          { kind: "item", id: "cake", name: "Cake", unitPrice: 400, quantity: 2 },
        ],
      },
    });
    expect(foodRevenue(x)).toBe(0);
    expect(addOnsTotal(x)).toBe(800);
    expect(roomRevenue(x)).toBe(3700);
  });

  it("absent foodBill counts as 0; never negative", () => {
    expect(roomRevenue(b({ amount: 2000 }))).toBe(2000);
    expect(roomRevenue(b({ amount: 100, foodBill: 500 }))).toBe(0);
  });
});
