import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { onlinePortion } from "@/lib/booking/payments";
import type { Booking, BookingPayment } from "@/types";

export const runtime = "nodejs";

const COLLECTION = "bookings";

export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (expected !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          status?: string;
          amount?: number;
        };
      };
    };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event !== "payment.captured" && event.event !== "payment.authorized") {
    // Ignored event — acknowledge to Razorpay to stop retries.
    return NextResponse.json({ ok: true, ignored: event.event });
  }

  const payment = event.payload?.payment?.entity;
  if (!payment?.order_id || !payment.id) {
    return NextResponse.json({ error: "Missing payment data" }, { status: 400 });
  }

  const snap = await adminDb
    .collection(COLLECTION)
    .where("razorpayOrderId", "==", payment.order_id)
    .limit(1)
    .get();

  if (snap.empty) {
    // Booking not found — log but don't fail the webhook.
    console.warn(`[razorpay-webhook] no booking for order ${payment.order_id}`);
    return NextResponse.json({ ok: true, unknown: true });
  }

  const doc = snap.docs[0]!;
  const booking = doc.data() as Booking;

  // Idempotency: don't reprocess a payment we've already seen, and never
  // resurrect a booking that has moved past `pending`. Razorpay sends both
  // authorized + captured events for the same payment, plus retries on 5xx,
  // so this can fire multiple times for one payment.
  if (booking.razorpayPaymentId === payment.id) {
    return NextResponse.json({ ok: true, alreadyProcessed: true });
  }
  if (booking.status !== "pending") {
    return NextResponse.json({
      ok: true,
      skipped: `status=${booking.status}`,
    });
  }

  // Record the captured amount as an online ledger entry. Prefer the actual
  // captured amount from Razorpay (paise → rupees); fall back to the plan's
  // expected online portion if the event omitted it.
  const plan = booking.paymentPlan ?? "full";
  const captured =
    typeof payment.amount === "number" && payment.amount > 0
      ? Math.round(payment.amount / 100)
      : onlinePortion(booking.amount, plan);
  const existing = booking.payments ?? [];
  const onlinePayment: BookingPayment = {
    id: crypto.randomUUID(),
    amount: captured,
    method: "razorpay",
    channel: "online",
    kind: plan === "deposit" ? "deposit" : "full",
    at: Date.now(),
    razorpayPaymentId: payment.id,
  };
  const payments = [...existing, onlinePayment];
  const amountPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  await doc.ref.update({
    status: "confirmed",
    amountPaid,
    payments,
    paymentMethod: "razorpay",
    razorpayPaymentId: payment.id,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
