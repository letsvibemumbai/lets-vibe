"use server";

import crypto from "node:crypto";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { getScreen } from "@/lib/db/screens.server";
import { razorpay } from "@/lib/razorpay/server";
import { rupeesToPaise } from "@/lib/razorpay/util";
import {
  checkSlotStillAvailable,
  getAvailableSlots,
  getAvailabilityForDate,
  minutesToTime,
  timeToMinutes,
} from "@/lib/slots/engine";
import { resolveSelectionsAgainstCatalog } from "@/lib/booking/addons";
import { SCREEN_IDS, SCREEN_PRESETS } from "@/lib/booking/constants";
import { onlinePortion } from "@/lib/booking/payments";
import { calculateBookingPrice, applyMembershipDiscount } from "@/lib/slots/pricing";
import {
  getAddonItem,
  getAddonPackage,
} from "@/lib/db/addons.server";
import { customerDocRef, writeCustomerUpsert } from "@/lib/db/customers.server";
import { maybeSendBookingConfirmation } from "@/lib/email/sendBookingConfirmation";
import type {
  Availability,
  Slot,
} from "@/lib/slots/engine";
import type {
  Booking,
  BookingAddonSelection,
  BookingPayment,
  Duration,
  ScreenId,
} from "@/types";

const ScreenIdSchema = z.enum(["beach", "grass", "forest"]);
const DurationSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");
const TimeSchema = z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:mm");

const CustomerSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(60),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  email: z.string().email().optional().or(z.literal("").transform(() => undefined)),
  guestCount: z.number().int().min(1, "At least 1 guest").max(10, "Up to 10 guests"),
});

const SelectionRequestSchema = z.object({
  kind: z.enum(["item", "package"]),
  id: z.string().trim().min(1),
  quantity: z.number().int().min(1).max(99),
});
export type SelectionRequest = z.infer<typeof SelectionRequestSchema>;

const AddOnsSchema = z.object({
  decorations: z.string().max(200).optional(),
  selections: z.array(SelectionRequestSchema).max(40).optional(),
});

function buildPersistedAddOns(
  raw: z.infer<typeof AddOnsSchema>,
  resolved: BookingAddonSelection[],
): Booking["addOns"] {
  const out: Booking["addOns"] = { selections: resolved };
  if (raw.decorations) out.decorations = raw.decorations;
  return out;
}

/**
 * Resolve client-submitted selections against Firestore via the shared
 * resolver. We never trust the client's price — names and effective
 * (per-screen) prices are snapshotted from the catalog, inactive entries are
 * rejected, screen-restricted items are enforced, and Movie-vs-Celebration
 * exclusivity is checked.
 */
async function resolveSelections(
  requests: SelectionRequest[],
  screenId: ScreenId,
): Promise<BookingAddonSelection[]> {
  return resolveSelectionsAgainstCatalog(
    requests,
    screenId,
    { getItem: getAddonItem, getPackage: getAddonPackage },
    { allowInactive: false, enforceScreenAvailability: true },
  );
}

const CreateBookingSchema = z.object({
  screenId: ScreenIdSchema,
  date: DateSchema,
  startTime: TimeSchema,
  endTime: TimeSchema,
  duration: DurationSchema,
  customer: CustomerSchema,
  addOns: AddOnsSchema,
  /** Firebase Auth uid of the signed-in guest, if any. Enables the membership
   * discount and links the booking to the user's /account dashboard. */
  customerUid: z.string().trim().min(1).max(128).optional(),
  /** Pay the whole bill online, or just the 50% deposit (rest at the venue). */
  paymentPlan: z.enum(["full", "deposit"]).default("full"),
});

const MEMBERSHIPS = "memberships";

export type CreateBookingPayload = z.infer<typeof CreateBookingSchema>;

const COLLECTION = "bookings";

async function fetchScreenOrThrow(screenId: ScreenId) {
  const screen = await getScreen(screenId);
  if (!screen) {
    throw new Error(`Screen "${screenId}" not found. Run \`npm run seed\` to populate Firestore.`);
  }
  return screen;
}

async function bookingsForScreenDate(screenId: ScreenId, date: string): Promise<Booking[]> {
  const snap = await adminDb
    .collection(COLLECTION)
    .where("screenId", "==", screenId)
    .where("date", "==", date)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking);
}

export async function getSlotsAction(
  screenId: ScreenId,
  date: string,
  duration: Duration,
): Promise<Slot[]> {
  const parsed = z
    .object({ screenId: ScreenIdSchema, date: DateSchema, duration: DurationSchema })
    .parse({ screenId, date, duration });
  const screen = await fetchScreenOrThrow(parsed.screenId);
  const existing = await bookingsForScreenDate(parsed.screenId, parsed.date);
  return getAvailableSlots(screen, parsed.date, parsed.duration, existing);
}

export async function getAllSlotsAction(
  screenId: ScreenId,
  date: string,
): Promise<Availability> {
  const parsed = z
    .object({ screenId: ScreenIdSchema, date: DateSchema })
    .parse({ screenId, date });
  const screen = await fetchScreenOrThrow(parsed.screenId);
  const existing = await bookingsForScreenDate(parsed.screenId, parsed.date);
  return getAvailabilityForDate(screen, parsed.date, existing);
}

type CreateBookingResult = {
  bookingId: string;
  orderId: string;
  amount: number;
  currency: "INR";
  key: string;
};

export async function createBookingAndOrder(
  rawPayload: CreateBookingPayload,
): Promise<CreateBookingResult> {
  const payload = CreateBookingSchema.parse(rawPayload);
  const screen = await fetchScreenOrThrow(payload.screenId);

  // Resolve dynamic selections against Firestore — price authoritative on
  // server, not the client. Empty when the booking has no dynamic add-ons.
  const resolvedSelections = await resolveSelections(
    payload.addOns.selections ?? [],
    payload.screenId,
  );
  const addOnsForPricing = {
    ...payload.addOns,
    selections: resolvedSelections,
  };
  const amount = calculateBookingPrice(screen, payload.duration, addOnsForPricing);

  // Atomic slot guard + pending booking write.
  const bookingId = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(
      adminDb
        .collection(COLLECTION)
        .where("screenId", "==", payload.screenId)
        .where("date", "==", payload.date),
    );
    const existing = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking);

    if (
      !checkSlotStillAvailable(
        screen,
        payload.date,
        payload.startTime,
        payload.duration,
        existing,
      )
    ) {
      throw new Error("SLOT_UNAVAILABLE");
    }

    const ref = adminDb.collection(COLLECTION).doc();
    tx.set(ref, {
      screenId: payload.screenId,
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
      duration: payload.duration,
      customerName: payload.customer.name,
      customerPhone: payload.customer.phone,
      customerEmail: payload.customer.email ?? null,
      guestCount: payload.customer.guestCount,
      addOns: buildPersistedAddOns(payload.addOns, resolvedSelections),
      amount,
      amountPaid: 0,
      payments: [],
      paymentPlan: payload.paymentPlan,
      status: "pending",
      source: "online",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return ref.id;
  });

  // Capture the full bill or just the 50% deposit, per the chosen plan. The
  // remainder (for a deposit) is collected at the venue.
  const onlineAmount = onlinePortion(amount, payload.paymentPlan);

  // Razorpay order — outside the transaction (external call).
  const order = await razorpay().orders.create({
    amount: rupeesToPaise(onlineAmount),
    currency: "INR",
    receipt: bookingId,
    notes: {
      screenId: payload.screenId,
      date: payload.date,
      startTime: payload.startTime,
      paymentPlan: payload.paymentPlan,
    },
  });

  await adminDb
    .collection(COLLECTION)
    .doc(bookingId)
    .update({
      razorpayOrderId: order.id,
      updatedAt: FieldValue.serverTimestamp(),
    });

  return {
    bookingId,
    orderId: order.id,
    // The amount Razorpay will actually charge (full bill or deposit).
    amount: onlineAmount,
    currency: "INR",
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  };
}

/**
 * TEMPORARY — Razorpay bypass. Creates the booking and confirms it in a single
 * step, skipping the payment gateway entirely. Same validation, slot guard, and
 * server-authoritative pricing as `createBookingAndOrder`, but no Razorpay order
 * is created and no signature is verified. `amountPaid` is left at 0 (no money
 * was actually collected) and a note records the bypass so admin/accounting
 * stays honest. Re-enable the real gateway by routing PaymentClient back to
 * `createBookingAndOrder` + `verifyPayment`.
 */
export async function confirmBookingDirect(
  rawPayload: CreateBookingPayload,
): Promise<{ bookingId: string; amount: number; discount: number }> {
  const payload = CreateBookingSchema.parse(rawPayload);
  const screen = await fetchScreenOrThrow(payload.screenId);

  const resolvedSelections = await resolveSelections(
    payload.addOns.selections ?? [],
    payload.screenId,
  );
  const grossAmount = calculateBookingPrice(screen, payload.duration, {
    ...payload.addOns,
    selections: resolvedSelections,
  });

  const result = await adminDb.runTransaction(async (tx) => {
    // --- all reads first (Firestore transaction rule) ---
    const snap = await tx.get(
      adminDb
        .collection(COLLECTION)
        .where("screenId", "==", payload.screenId)
        .where("date", "==", payload.date),
    );

    const memberRef = payload.customerUid
      ? adminDb.collection(MEMBERSHIPS).doc(payload.customerUid)
      : null;
    const memberSnap = memberRef ? await tx.get(memberRef) : null;

    const customerRef = customerDocRef(payload.customer.phone);
    const customerSnap = await tx.get(customerRef);

    // --- slot guard ---
    const existing = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking);
    if (
      !checkSlotStillAvailable(
        screen,
        payload.date,
        payload.startTime,
        payload.duration,
        existing,
      )
    ) {
      throw new Error("SLOT_UNAVAILABLE");
    }

    // --- membership discount (active member with a remaining allowance) ---
    let amount = grossAmount;
    let discount = 0;
    if (memberSnap?.exists) {
      const m = memberSnap.data() as {
        status?: string;
        remainingDiscountedBookings?: number;
        discountPercent?: number;
      };
      const remaining = m.remainingDiscountedBookings ?? 0;
      if (m.status === "active" && remaining > 0 && (m.discountPercent ?? 0) > 0) {
        const applied = applyMembershipDiscount(grossAmount, m.discountPercent!);
        amount = applied.net;
        discount = applied.discount;
        tx.update(memberRef!, {
          remainingDiscountedBookings: remaining - 1,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }

    // --- create / link the phone-keyed customer account ---
    const customerId = writeCustomerUpsert(tx, customerSnap, {
      phone: payload.customer.phone,
      name: payload.customer.name,
      email: payload.customer.email ?? null,
      date: payload.date,
      source: "online",
    });

    // --- write the booking ---
    const ref = adminDb.collection(COLLECTION).doc();
    tx.set(ref, {
      screenId: payload.screenId,
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
      duration: payload.duration,
      customerName: payload.customer.name,
      customerPhone: payload.customer.phone,
      customerEmail: payload.customer.email ?? null,
      customerUid: payload.customerUid ?? null,
      customerId,
      guestCount: payload.customer.guestCount,
      addOns: buildPersistedAddOns(payload.addOns, resolvedSelections),
      amount,
      ...(discount > 0 ? { originalAmount: grossAmount, discount } : {}),
      amountPaid: 0,
      payments: [],
      paymentPlan: payload.paymentPlan,
      status: "confirmed",
      source: "online",
      notes: "Reserved without online payment (Razorpay bypass — temporary).",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { bookingId: ref.id, amount, discount };
  });

  // Fire the confirmation email (idempotent + non-fatal).
  await maybeSendBookingConfirmation(result.bookingId);

  return result;
}

export async function verifyPayment(
  bookingId: string,
  razorpayPaymentId: string,
  razorpayOrderId: string,
  razorpaySignature: string,
): Promise<{ ok: true }> {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error("RAZORPAY_KEY_SECRET missing");

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expected !== razorpaySignature) {
    throw new Error("INVALID_SIGNATURE");
  }

  const ref = adminDb.collection(COLLECTION).doc(bookingId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("BOOKING_NOT_FOUND");
  const booking = snap.data() as Booking;
  if (booking.razorpayOrderId !== razorpayOrderId) {
    throw new Error("ORDER_MISMATCH");
  }

  const plan = booking.paymentPlan ?? "full";
  const captured = onlinePortion(booking.amount, plan);
  const existing = booking.payments ?? [];
  const onlinePayment: BookingPayment = {
    id: crypto.randomUUID(),
    amount: captured,
    method: "razorpay",
    channel: "online",
    kind: plan === "deposit" ? "deposit" : "full",
    at: Date.now(),
    razorpayPaymentId,
  };
  const payments = [...existing, onlinePayment];
  const amountPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  await ref.update({
    status: "confirmed",
    amountPaid,
    payments,
    paymentMethod: "razorpay",
    razorpayPaymentId,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Fire the confirmation email (idempotent + non-fatal).
  await maybeSendBookingConfirmation(bookingId);

  return { ok: true };
}

export type ScreenAvailability = {
  screenId: ScreenId;
  name: string;
  available: boolean;
  startTime: string;
  endTime: string;
  startingPrice: number;
};

/**
 * Check which screens are free for a given date + start time + duration.
 * Powers the "Check availability" widgets on the homepage and the booking
 * start page. Falls back to SCREEN_PRESETS when a screen doc isn't in
 * Firestore yet, so it degrades gracefully on a fresh project.
 */
export async function checkAvailabilityAction(
  date: string,
  startTime: string,
  duration: Duration,
): Promise<ScreenAvailability[]> {
  const parsed = z
    .object({ date: DateSchema, startTime: TimeSchema, duration: DurationSchema })
    .parse({ date, startTime, duration });

  const endTime = minutesToTime(timeToMinutes(parsed.startTime) + parsed.duration * 60);

  const results = await Promise.all(
    SCREEN_IDS.map(async (id) => {
      const screen = (await getScreen(id)) ?? SCREEN_PRESETS[id];
      const existing = await bookingsForScreenDate(id, parsed.date);
      const slots = getAvailableSlots(screen, parsed.date, parsed.duration, existing);
      const available = slots.some((s) => s.startTime === parsed.startTime);
      return {
        screenId: id,
        name: screen.name,
        available,
        startTime: parsed.startTime,
        endTime,
        startingPrice: screen.basePrices[`${parsed.duration}h` as `${Duration}h`],
      } satisfies ScreenAvailability;
    }),
  );

  return results;
}

export async function cancelPendingBooking(bookingId: string): Promise<void> {
  const ref = adminDb.collection(COLLECTION).doc(bookingId);
  const snap = await ref.get();
  if (!snap.exists) return;
  const booking = snap.data() as Booking;
  if (booking.status !== "pending") return;
  await ref.update({
    status: "cancelled",
    updatedAt: FieldValue.serverTimestamp(),
  });
}
