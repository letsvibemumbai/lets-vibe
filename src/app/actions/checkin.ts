"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { getBooking, updateBooking } from "@/lib/db/bookings.server";
import type { Booking } from "@/types";

const IdSchema = z.string().trim().min(1);
const NoteSchema = z
  .string()
  .trim()
  .max(300)
  .optional()
  .or(z.literal("").transform(() => undefined));

// FieldValue.delete() sentinel, typed to satisfy the optional numeric fields on
// Booking. At runtime it deletes the field in a merge write (it is NOT
// undefined, so ignoreUndefinedProperties does not strip it).
const clear = () => FieldValue.delete() as unknown as undefined;

function revalidate(id: string) {
  revalidatePath(`/admin/check-in/${id}`);
  revalidatePath("/admin/check-in");
  revalidatePath(`/admin/bookings/${id}`);
  revalidatePath("/admin/bookings");
}

/** Grant entry. Idempotent; refuses cancelled bookings. */
export async function admitBookingAction(
  rawId: string,
  rawNote?: string,
): Promise<void> {
  await requireAdmin();
  const id = IdSchema.parse(rawId);
  const note = NoteSchema.parse(rawNote);
  const booking = await getBooking(id);
  if (!booking) throw new Error("Booking not found");
  if (booking.status === "cancelled") {
    throw new Error("This booking is cancelled — it cannot be admitted.");
  }
  if (booking.checkInStatus === "admitted") return; // already in — idempotent

  const data: Partial<Booking> = {
    checkInStatus: "admitted",
    checkedInAt: Date.now(),
    checkInRejectedAt: clear(), // a prior rejection no longer applies
  };
  if (note) data.checkInNote = note;
  await updateBooking(id, data);
  revalidate(id);
}

/** Deny entry. Records the decision (does not cancel the booking). */
export async function rejectBookingAction(
  rawId: string,
  rawNote?: string,
): Promise<void> {
  await requireAdmin();
  const id = IdSchema.parse(rawId);
  const note = NoteSchema.parse(rawNote);
  const booking = await getBooking(id);
  if (!booking) throw new Error("Booking not found");

  const data: Partial<Booking> = {
    checkInStatus: "rejected",
    checkInRejectedAt: Date.now(),
    checkedInAt: clear(), // never both admitted and rejected
  };
  if (note) data.checkInNote = note;
  await updateBooking(id, data);
  revalidate(id);
}

/** Reset an admit/reject decision back to awaiting (fixes a mistaken scan). */
export async function undoCheckInAction(rawId: string): Promise<void> {
  await requireAdmin();
  const id = IdSchema.parse(rawId);
  const booking = await getBooking(id);
  if (!booking) throw new Error("Booking not found");
  await updateBooking(id, {
    checkInStatus: "awaiting",
    checkedInAt: clear(),
    checkInRejectedAt: clear(),
  });
  revalidate(id);
}
