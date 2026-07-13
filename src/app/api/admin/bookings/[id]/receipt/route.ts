import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { getBooking } from "@/lib/db/bookings.server";
import { buildReceiptPdf } from "@/lib/export/receiptPdf";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  await requireAdmin();

  const { id } = await ctx.params;
  const booking = await getBooking(id);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const buffer = await buildReceiptPdf(booking);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      // inline so the receipt opens in the browser's PDF viewer.
      "Content-Disposition": `inline; filename="receipt-${id}.pdf"`,
    },
  });
}
