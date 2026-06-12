"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { adminDb } from "@/lib/firebase/admin";
import { effectivePayments, sumPayments } from "@/lib/booking/payments";
import type { Booking, BookingPayment } from "@/types";

const COLLECTION = "bookings";

const IdSchema = z.string().trim().min(1);

// Door tenders. Razorpay is gateway-only and never recorded by hand here.
const DoorMethodSchema = z.enum(["upi", "cash", "card", "bank"]);

const RecordSchema = z.object({
  amount: z.number().int().min(1, "Enter an amount").max(1_000_000),
  method: DoorMethodSchema,
  note: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type RecordPaymentPayload = z.infer<typeof RecordSchema>;

function revalidate(id: string) {
  revalidatePath(`/admin/check-in/${id}`);
  revalidatePath(`/admin/bookings/${id}`);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/accounting");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/reports");
  revalidatePath("/admin");
  revalidatePath(`/book/${id}/status`);
}

/**
 * Record a payment collected in person (at the door / front desk). Appends a
 * `venue` entry to the booking's ledger and recomputes the cached `amountPaid`.
 * Atomic so two staff recording at once can't clobber each other. Legacy
 * bookings (no ledger yet) are migrated on first write via `effectivePayments`.
 */
export async function recordBookingPaymentAction(
  rawId: string,
  raw: RecordPaymentPayload,
): Promise<{ amountPaid: number; balanceDue: number }> {
  await requireAdmin();
  const id = IdSchema.parse(rawId);
  const payload = RecordSchema.parse(raw);

  const ref = adminDb.collection(COLLECTION).doc(id);
  const result = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("Booking not found");
    const booking = { id, ...snap.data() } as Booking;

    const base = effectivePayments(booking);
    const entry: BookingPayment = {
      id: crypto.randomUUID(),
      amount: payload.amount,
      method: payload.method,
      channel: "venue",
      kind: base.length > 0 ? "balance" : "full",
      at: Date.now(),
      ...(payload.note ? { note: payload.note } : {}),
    };
    const payments = [...base, entry];
    const amountPaid = sumPayments(payments);

    tx.update(ref, {
      payments,
      amountPaid,
      paymentMethod: payload.method,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { amountPaid, balanceDue: Math.max(0, booking.amount - amountPaid) };
  });

  revalidate(id);
  return result;
}

/**
 * Remove a payment from the ledger (fix a mis-entry). Recomputes `amountPaid`.
 */
export async function removeBookingPaymentAction(
  rawId: string,
  rawPaymentId: string,
): Promise<{ amountPaid: number; balanceDue: number }> {
  await requireAdmin();
  const id = IdSchema.parse(rawId);
  const paymentId = IdSchema.parse(rawPaymentId);

  const ref = adminDb.collection(COLLECTION).doc(id);
  const result = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("Booking not found");
    const booking = { id, ...snap.data() } as Booking;

    // Materialize the ledger (bridging legacy) then drop the target entry.
    const payments = effectivePayments(booking).filter((p) => p.id !== paymentId);
    const amountPaid = sumPayments(payments);

    tx.update(ref, {
      payments,
      amountPaid,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { amountPaid, balanceDue: Math.max(0, booking.amount - amountPaid) };
  });

  revalidate(id);
  return result;
}
