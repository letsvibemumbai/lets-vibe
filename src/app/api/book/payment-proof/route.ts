import { NextResponse, type NextRequest } from "next/server";
import { uploadPublicBlob } from "@/lib/storage/upload";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Customer-facing upload for a UPI/GPay payment screenshot at checkout. Public
 * (the booking flow runs before any server session exists), so it is locked
 * down to images only and the shared 5MB cap in `uploadPublicBlob`. The blob
 * is stored privately (no `makePublic()`) — only admins can fetch a signed
 * URL to view it from /admin/bookings/[id]. Returns the storage `path`, which
 * the client passes to `submitUpiBooking`.
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = rateLimit(`payment-proof:${ip}`, { capacity: 6, refillPerSec: 0.1 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many uploads — please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  const result = await uploadPublicBlob(file, {
    prefix: "payment-proofs",
    allow: ["image/jpeg", "image/png", "image/webp"],
    public: false,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ path: result.path });
}
