"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { adminDb } from "@/lib/firebase/admin";
import {
  getBooking,
  listBookingsForExport,
  type BookingListFilters,
  updateBooking,
} from "@/lib/db/bookings.server";
import { getScreen } from "@/lib/db/screens.server";
import { razorpay } from "@/lib/razorpay/server";
import { rupeesToPaise } from "@/lib/razorpay/util";
import {
  checkSlotStillAvailable,
  getAvailableSlots,
  timeToMinutes,
  minutesToTime,
  type Slot,
} from "@/lib/slots/engine";
import { calculateBookingPrice } from "@/lib/slots/pricing";
import {
  getAddonItem,
  getAddonPackage,
} from "@/lib/db/addons.server";
import type {
  Booking,
  BookingAddonSelection,
  BookingPaymentMethod,
  BookingSource,
  BookingStatus,
  Duration,
  ScreenId,
} from "@/types";

const COLLECTION = "bookings";

const IdSchema = z.string().min(1);
const ScreenIdSchema = z.enum(["beach", "grass", "forest"]);
const DurationSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");
const TimeSchema = z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:mm");
const PhoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");
const PaymentMethodSchema = z.enum(["razorpay", "cash", "upi", "card", "bank"]);

function revalidate() {
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/calendar");
}

export async function markBookingCompletedAction(rawId: string): Promise<void> {
  await requireAdmin();
  const id = IdSchema.parse(rawId);
  const booking = await getBooking(id);
  if (!booking) throw new Error("Booking not found");
  if (booking.status !== "confirmed") {
    throw new Error("Only confirmed bookings can be marked completed");
  }
  await updateBooking(id, { status: "completed" });
  revalidate();
  revalidatePath(`/admin/bookings/${id}`);
}

export async function cancelBookingAction(rawId: string): Promise<void> {
  await requireAdmin();
  const id = IdSchema.parse(rawId);
  const booking = await getBooking(id);
  if (!booking) throw new Error("Booking not found");
  if (booking.status === "cancelled") return;
  if (booking.status === "completed") {
    throw new Error("Completed bookings cannot be cancelled");
  }
  await updateBooking(id, {
    status: "cancelled",
    cancelledAt: Date.now(),
  });
  revalidate();
  revalidatePath(`/admin/bookings/${id}`);
}

const SelectionRequestSchema = z.object({
  kind: z.enum(["item", "package"]),
  id: z.string().trim().min(1),
  quantity: z.number().int().min(1).max(99),
});

async function resolveAdminSelections(
  requests: z.infer<typeof SelectionRequestSchema>[],
): Promise<BookingAddonSelection[]> {
  if (requests.length === 0) return [];
  const resolved: BookingAddonSelection[] = [];
  for (const req of requests) {
    if (req.kind === "item") {
      const item = await getAddonItem(req.id);
      if (!item) throw new Error(`ADDON_ITEM_NOT_FOUND:${req.id}`);
      // Admins can pick inactive items (they're correcting existing bookings).
      const qty = Math.min(req.quantity, Math.max(1, item.maxQuantity));
      resolved.push({
        kind: "item",
        id: item.id,
        name: item.name,
        unitPrice: item.price,
        quantity: qty,
      });
    } else {
      const pkg = await getAddonPackage(req.id);
      if (!pkg) throw new Error(`ADDON_PACKAGE_NOT_FOUND:${req.id}`);
      resolved.push({
        kind: "package",
        id: pkg.id,
        name: pkg.name,
        unitPrice: pkg.price,
        quantity: 1,
      });
    }
  }
  return resolved;
}

const UpdateDetailsSchema = z.object({
  customerName: z.string().trim().min(2).max(60),
  customerPhone: PhoneSchema,
  customerEmail: z
    .string()
    .email()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  guestCount: z.number().int().min(1).max(10),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
  notes: z
    .string()
    .max(1000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  addOns: z.object({
    decorations: z
      .string()
      .max(200)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    selections: z.array(SelectionRequestSchema).max(40).optional(),
  }),
});

export type UpdateBookingDetailsPayload = z.infer<typeof UpdateDetailsSchema>;

export async function updateBookingDetailsAction(
  rawId: string,
  raw: UpdateBookingDetailsPayload,
): Promise<void> {
  await requireAdmin();
  const id = IdSchema.parse(rawId);
  const payload = UpdateDetailsSchema.parse(raw);
  const booking = await getBooking(id);
  if (!booking) throw new Error("Booking not found");

  // Status transitions: don't allow re-opening a cancelled booking without
  // re-checking slot availability (out of scope for this edit form).
  if (booking.status === "cancelled" && payload.status !== "cancelled") {
    throw new Error("Reopen a cancelled booking by creating a new one");
  }
  if (booking.status === "completed" && payload.status !== "completed") {
    throw new Error("Completed bookings cannot change status");
  }

  const selections = await resolveAdminSelections(payload.addOns.selections ?? []);
  await updateBooking(id, {
    customerName: payload.customerName,
    customerPhone: payload.customerPhone,
    customerEmail: payload.customerEmail ?? undefined,
    guestCount: payload.guestCount,
    status: payload.status,
    notes: payload.notes ?? undefined,
    addOns: {
      decorations: payload.addOns.decorations,
      selections,
    },
  });
  revalidate();
  revalidatePath(`/admin/bookings/${id}`);
}

export async function refundBookingAction(rawId: string): Promise<void> {
  await requireAdmin();
  const id = IdSchema.parse(rawId);
  const booking = await getBooking(id);
  if (!booking) throw new Error("Booking not found");
  if (booking.source !== "online") {
    throw new Error("Only online bookings can be refunded via Razorpay");
  }
  if (!booking.razorpayPaymentId) {
    throw new Error("This booking has no captured payment to refund");
  }
  if (booking.razorpayRefundId) {
    throw new Error("This booking has already been refunded");
  }

  const refund = await razorpay().payments.refund(
    booking.razorpayPaymentId,
    {
      amount: rupeesToPaise(booking.amountPaid || booking.amount),
      speed: "normal",
      notes: { bookingId: id },
    },
  );

  await updateBooking(id, {
    status: "cancelled",
    razorpayRefundId: refund.id,
    refundedAt: Date.now(),
    cancelledAt: booking.cancelledAt ?? Date.now(),
  });
  revalidate();
  revalidatePath(`/admin/bookings/${id}`);
}

const CreateOfflineSchema = z.object({
  screenId: ScreenIdSchema,
  date: DateSchema,
  startTime: TimeSchema,
  duration: DurationSchema,
  customer: z.object({
    name: z.string().trim().min(2, "Name is required").max(60),
    phone: PhoneSchema,
    email: z
      .string()
      .email()
      .optional()
      .or(z.literal("").transform(() => undefined)),
    guestCount: z.number().int().min(1).max(10),
  }),
  addOns: z.object({
    decorations: z
      .string()
      .max(200)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    selections: z.array(SelectionRequestSchema).max(40).optional(),
  }),
  paymentMethod: PaymentMethodSchema,
  amount: z.number().int().min(0),
  notes: z
    .string()
    .max(1000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type CreateOfflineBookingPayload = z.infer<typeof CreateOfflineSchema>;

export async function createOfflineBookingAction(
  raw: CreateOfflineBookingPayload,
): Promise<{ bookingId: string }> {
  await requireAdmin();
  const payload = CreateOfflineSchema.parse(raw);
  if (payload.paymentMethod === "razorpay") {
    throw new Error("Offline bookings cannot use Razorpay as payment method");
  }
  const screen = await getScreen(payload.screenId);
  if (!screen) throw new Error(`Screen "${payload.screenId}" not found`);

  const resolvedSelections = await resolveAdminSelections(
    payload.addOns.selections ?? [],
  );
  const originalAmount = calculateBookingPrice(screen, payload.duration, {
    decorations: payload.addOns.decorations,
    selections: resolvedSelections,
  });
  const finalAmount = payload.amount;
  const discount = Math.max(0, originalAmount - finalAmount);
  const endTime = minutesToTime(
    timeToMinutes(payload.startTime) + payload.duration * 60,
  );

  const bookingId = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(
      adminDb
        .collection(COLLECTION)
        .where("screenId", "==", payload.screenId)
        .where("date", "==", payload.date),
    );
    const existing = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Booking,
    );
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
      endTime,
      duration: payload.duration,
      customerName: payload.customer.name,
      customerPhone: payload.customer.phone,
      customerEmail: payload.customer.email ?? null,
      guestCount: payload.customer.guestCount,
      addOns: {
        decorations: payload.addOns.decorations ?? null,
        selections: resolvedSelections,
      },
      amount: finalAmount,
      amountPaid: finalAmount,
      originalAmount,
      discount,
      status: "confirmed" satisfies BookingStatus,
      source: "offline" satisfies BookingSource,
      paymentMethod: payload.paymentMethod satisfies BookingPaymentMethod,
      notes: payload.notes ?? null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return ref.id;
  });

  revalidate();
  redirect(`/admin/bookings/${bookingId}`);
}

const BulkSchema = z.object({
  ids: z.array(IdSchema).min(1).max(200),
  action: z.enum(["complete", "cancel"]),
});

export async function bulkUpdateStatusAction(
  rawIds: string[],
  action: "complete" | "cancel",
): Promise<{ updated: number }> {
  await requireAdmin();
  const { ids, action: act } = BulkSchema.parse({ ids: rawIds, action });

  let updated = 0;
  const batch = adminDb.batch();
  const snaps = await Promise.all(
    ids.map((id) => adminDb.collection(COLLECTION).doc(id).get()),
  );
  const now = Date.now();
  for (const snap of snaps) {
    if (!snap.exists) continue;
    const b = snap.data() as Booking;
    if (act === "complete") {
      if (b.status !== "confirmed") continue;
      batch.update(snap.ref, {
        status: "completed",
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      if (b.status === "cancelled" || b.status === "completed") continue;
      batch.update(snap.ref, {
        status: "cancelled",
        cancelledAt: now,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    updated += 1;
  }
  if (updated > 0) await batch.commit();
  revalidate();
  return { updated };
}

const FiltersSchema = z.object({
  screenId: z
    .enum(["beach", "grass", "forest"])
    .optional(),
  status: z
    .enum(["pending", "confirmed", "completed", "cancelled"])
    .optional(),
  source: z.enum(["online", "offline"]).optional(),
  dateFrom: DateSchema.optional(),
  dateTo: DateSchema.optional(),
  query: z.string().optional(),
});

function csvEscape(value: string | number | undefined | null): string {
  const s = value === undefined || value === null ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function exportBookingsCsvAction(
  rawFilters: BookingListFilters,
): Promise<string> {
  await requireAdmin();
  const filters = FiltersSchema.parse(rawFilters);
  const rows = await listBookingsForExport(filters);

  const headers = [
    "id",
    "date",
    "startTime",
    "endTime",
    "screenId",
    "duration",
    "customerName",
    "customerPhone",
    "customerEmail",
    "guestCount",
    "amount",
    "amountPaid",
    "discount",
    "status",
    "source",
    "paymentMethod",
    "razorpayOrderId",
    "razorpayPaymentId",
    "razorpayRefundId",
    "addOnSelections",
    "addOnDecorations",
    "notes",
    "createdAt",
  ];
  const lines = [headers.join(",")];
  for (const b of rows) {
    lines.push(
      [
        csvEscape(b.id),
        csvEscape(b.date),
        csvEscape(b.startTime),
        csvEscape(b.endTime),
        csvEscape(b.screenId),
        csvEscape(b.duration),
        csvEscape(b.customerName),
        csvEscape(b.customerPhone),
        csvEscape(b.customerEmail),
        csvEscape(b.guestCount),
        csvEscape(b.amount),
        csvEscape(b.amountPaid),
        csvEscape(b.discount ?? 0),
        csvEscape(b.status),
        csvEscape(b.source),
        csvEscape(b.paymentMethod),
        csvEscape(b.razorpayOrderId),
        csvEscape(b.razorpayPaymentId),
        csvEscape(b.razorpayRefundId),
        csvEscape(
          (b.addOns.selections ?? [])
            .map((s) => (s.quantity > 1 ? `${s.name} x${s.quantity}` : s.name))
            .join(" | "),
        ),
        csvEscape(b.addOns.decorations),
        csvEscape(b.notes),
        csvEscape(
          typeof b.createdAt === "number"
            ? new Date(b.createdAt).toISOString()
            : "",
        ),
      ].join(","),
    );
  }
  return lines.join("\n");
}

// Slot lookup for the offline-create form. Mirrors the public action but is
// admin-gated.
export async function getOfflineSlotsAction(
  rawScreenId: ScreenId,
  rawDate: string,
  rawDuration: Duration,
): Promise<Slot[]> {
  await requireAdmin();
  const parsed = z
    .object({
      screenId: ScreenIdSchema,
      date: DateSchema,
      duration: DurationSchema,
    })
    .parse({ screenId: rawScreenId, date: rawDate, duration: rawDuration });
  const screen = await getScreen(parsed.screenId);
  if (!screen) throw new Error(`Screen "${parsed.screenId}" not found`);
  const snap = await adminDb
    .collection(COLLECTION)
    .where("screenId", "==", parsed.screenId)
    .where("date", "==", parsed.date)
    .get();
  const existing = snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as Booking,
  );
  return getAvailableSlots(screen, parsed.date, parsed.duration, existing);
}

