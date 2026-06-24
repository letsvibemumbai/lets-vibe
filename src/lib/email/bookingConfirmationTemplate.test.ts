import { describe, expect, it } from "vitest";
import { renderBookingConfirmation } from "./bookingConfirmationTemplate";
import type { Booking, Screen } from "@/types";

const screen: Screen = {
  id: "beach",
  name: "Beach Vibes",
  theme: "beach",
  description: "Coastal warmth.",
  operatingStart: 9,
  operatingEnd: 21,
  basePrices: { "1h": 1500, "2h": 2500, "3h": 3500 },
  imageUrl: "",
};

function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "bk_test_123456789",
    screenId: "beach",
    date: "2027-12-20",
    startTime: "14:00",
    endTime: "16:00",
    duration: 2,
    customerName: "Asha Rao",
    customerPhone: "9000000001",
    customerEmail: "asha@example.com",
    guestCount: 2,
    addOns: { selections: [] },
    amount: 2500,
    amountPaid: 2500,
    payments: [
      { id: "p1", amount: 2500, method: "upi", channel: "online", kind: "full", at: 0 },
    ],
    paymentPlan: "full",
    status: "confirmed",
    source: "online",
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe("renderBookingConfirmation", () => {
  it("renders a 'Booking confirmed' subject + body with the customer's name", () => {
    const { subject, html, text } = renderBookingConfirmation({
      booking: booking(),
      screen,
      appUrl: "https://letsvibe.test",
    });
    expect(subject).toMatch(/Booking confirmed — Beach Vibes/);
    expect(text).toContain("BOOKING CONFIRMED");
    expect(html).toContain("Booking confirmed");
    expect(html).toContain("Asha"); // first name
    expect(html).toContain("₹2,500");
    // status link points at the booking
    expect(html).toContain("https://letsvibe.test/book/bk_test_123456789/status");
  });

  it("shows 'Paid in full' when the whole bill was collected", () => {
    const { text } = renderBookingConfirmation({
      booking: booking(),
      screen,
      appUrl: "https://letsvibe.test",
    });
    expect(text).toContain("Paid in full");
  });

  it("shows the venue balance when only the deposit was paid", () => {
    const { text } = renderBookingConfirmation({
      booking: booking({
        paymentPlan: "deposit",
        amountPaid: 1250,
        payments: [
          { id: "p1", amount: 1250, method: "upi", channel: "online", kind: "deposit", at: 0 },
        ],
      }),
      screen,
      appUrl: "https://letsvibe.test",
    });
    expect(text).toContain("due at the venue");
    expect(text).toContain("₹1,250");
  });

  it("lists selected add-ons", () => {
    const { html, text } = renderBookingConfirmation({
      booking: booking({
        addOns: {
          selections: [
            { kind: "item", id: "cake", name: "Celebration Cake", unitPrice: 600, quantity: 1 },
          ],
        },
      }),
      screen,
      appUrl: "https://letsvibe.test",
    });
    expect(html).toContain("Celebration Cake");
    expect(text).toContain("Celebration Cake");
  });
});
