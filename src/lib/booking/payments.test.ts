import { describe, expect, it } from "vitest";
import {
  applyUpiConfirmation,
  buildUpiUri,
  depositAmount,
  balanceAmount,
  onlinePortion,
} from "./payments";
import type { Booking, BookingPayment } from "@/types";

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "bk1",
    screenId: "beach",
    date: "2027-12-20",
    startTime: "14:00",
    endTime: "16:00",
    duration: 2,
    customerName: "Test",
    customerPhone: "9000000001",
    guestCount: 2,
    addOns: { selections: [] },
    amount: 3000,
    amountPaid: 0,
    payments: [],
    paymentPlan: "full",
    status: "pending",
    source: "online",
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe("depositAmount / balanceAmount", () => {
  it("splits a bill into deposit + balance that sum to the total", () => {
    expect(depositAmount(2500)).toBe(1250);
    expect(balanceAmount(2500)).toBe(1250);
    expect(depositAmount(2500) + balanceAmount(2500)).toBe(2500);
  });

  it("keeps deposit + balance exact for odd totals", () => {
    const total = 3501;
    expect(depositAmount(total) + balanceAmount(total)).toBe(total);
  });
});

describe("onlinePortion", () => {
  it("charges the full bill for the full plan", () => {
    expect(onlinePortion(3000, "full")).toBe(3000);
  });
  it("charges the deposit for the deposit plan", () => {
    expect(onlinePortion(3000, "deposit")).toBe(1500);
  });
});

describe("buildUpiUri", () => {
  it("returns null when no VPA is configured", () => {
    expect(buildUpiUri({ amount: 2500 })).toBeNull();
    expect(buildUpiUri({ vpa: "  ", amount: 2500 })).toBeNull();
  });

  it("builds a upi:// link with payee + amount", () => {
    const uri = buildUpiUri({
      vpa: "letsvibe@okhdfcbank",
      payeeName: "Let's Vibe",
      amount: 2500,
      note: "Booking",
    });
    expect(uri).not.toBeNull();
    const url = new URL(uri!);
    expect(url.protocol).toBe("upi:");
    const params = new URLSearchParams(url.search);
    expect(params.get("pa")).toBe("letsvibe@okhdfcbank");
    expect(params.get("pn")).toBe("Let's Vibe");
    expect(params.get("am")).toBe("2500");
    expect(params.get("cu")).toBe("INR");
    expect(params.get("tn")).toBe("Booking");
  });

  it("omits the amount when it is zero or missing", () => {
    const uri = buildUpiUri({ vpa: "x@y", amount: 0 });
    expect(new URLSearchParams(new URL(uri!).search).has("am")).toBe(false);
  });
});

describe("applyUpiConfirmation", () => {
  it("records the full bill as a UPI payment for the full plan", () => {
    const { payments, amountPaid, captured } = applyUpiConfirmation(
      makeBooking({ paymentPlan: "full", amount: 3000 }),
      { id: "pay1", at: 111 },
    );
    expect(captured).toBe(3000);
    expect(amountPaid).toBe(3000);
    expect(payments).toHaveLength(1);
    expect(payments[0]).toMatchObject({
      id: "pay1",
      amount: 3000,
      method: "upi",
      channel: "online",
      kind: "full",
      at: 111,
    });
  });

  it("records only the 50% deposit for the deposit plan", () => {
    const { payments, amountPaid, captured } = applyUpiConfirmation(
      makeBooking({ paymentPlan: "deposit", amount: 3000 }),
      { id: "pay1", at: 0 },
    );
    expect(captured).toBe(1500);
    expect(amountPaid).toBe(1500);
    expect(payments[0].kind).toBe("deposit");
  });

  it("appends to existing payments without dropping them", () => {
    const existing: BookingPayment = {
      id: "old",
      amount: 500,
      method: "cash",
      channel: "venue",
      kind: "deposit",
      at: 1,
    };
    const { payments, amountPaid } = applyUpiConfirmation(
      makeBooking({ amount: 3000, amountPaid: 500, payments: [existing] }),
      { id: "pay2", at: 2 },
    );
    expect(payments).toHaveLength(2);
    expect(payments.map((p) => p.id)).toEqual(["old", "pay2"]);
    expect(amountPaid).toBe(3500);
  });

  it("treats a missing paymentPlan as full", () => {
    const b = makeBooking({ amount: 2000 });
    delete b.paymentPlan;
    expect(applyUpiConfirmation(b, { id: "p", at: 0 }).captured).toBe(2000);
  });
});
