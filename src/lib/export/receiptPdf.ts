import "server-only";
import { SCREEN_LABEL, formatINR } from "@/components/admin/dashboard/utils";
import { addOnsTotal, foodRevenue, roomRevenue } from "@/lib/booking/revenue";
import {
  PAYMENT_METHOD_LABEL,
  PAYMENT_METHODS,
  balanceDue,
  collectedByMethod,
} from "@/lib/booking/payments";
import type { Booking } from "@/types";
import { BRAND, pdfHeader, renderPdf } from "./brand";

/** Short, human-friendly slice of the Firestore booking id. */
function shortId(id: string): string {
  return id.length > 8 ? id.slice(0, 8).toUpperCase() : id.toUpperCase();
}

/**
 * Single-booking receipt / invoice PDF. Header, booking + customer blocks, a
 * line-item table (room, food, each add-on, then Total), payments received, and
 * a Balance due line (pink + bold when money is still owed).
 */
export async function buildReceiptPdf(b: Booking): Promise<Buffer> {
  return renderPdf((doc) => {
    pdfHeader(doc, {
      title: "PAYMENT RECEIPT",
      subtitle: `Booking #${shortId(b.id)}`,
    });

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const contentWidth = right - left;

    // Two info blocks side by side: booking details + customer.
    const colWidth = (contentWidth - 20) / 2;
    const blockTop = doc.y;

    const infoLine = (
      x: number,
      y: number,
      label: string,
      value: string,
    ): number => {
      doc.font("Helvetica").fontSize(8).fillColor(BRAND.muted);
      doc.text(label, x, y, { width: colWidth, lineBreak: false });
      doc.font("Helvetica").fontSize(9).fillColor(BRAND.ink);
      doc.text(value, x, y + 9, { width: colWidth, lineBreak: false });
      return y + 26;
    };

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(BRAND.gold)
      .text("Booking details", left, blockTop);
    let ly = blockTop + 16;
    ly = infoLine(left, ly, "Date", b.date);
    ly = infoLine(left, ly, "Time", `${b.startTime}–${b.endTime}`);
    ly = infoLine(left, ly, "Room", SCREEN_LABEL[b.screenId]);
    ly = infoLine(left, ly, "Guests", String(b.guestCount));

    const rx = left + colWidth + 20;
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(BRAND.gold)
      .text("Customer", rx, blockTop);
    let ry = blockTop + 16;
    ry = infoLine(rx, ry, "Name", b.customerName);
    ry = infoLine(rx, ry, "Phone", b.customerPhone);
    if (b.customerEmail) ry = infoLine(rx, ry, "Email", b.customerEmail);

    doc.y = Math.max(ly, ry) + 10;

    // ---- Line items table ----
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(BRAND.gold)
      .text("Items", left, doc.y);
    doc.y += 16;

    const amountX = right - 90;
    const lineItem = (label: string, amount: number, bold = false) => {
      const y = doc.y;
      doc
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(bold ? 10 : 9)
        .fillColor(BRAND.ink);
      doc.text(label, left, y, { width: amountX - left - 8, lineBreak: false });
      doc.text(formatINR(amount), amountX, y, {
        width: right - amountX,
        align: "right",
        lineBreak: false,
      });
      doc.y = y + (bold ? 18 : 15);
    };

    lineItem("Room", roomRevenue(b));
    const food = foodRevenue(b);
    if (food > 0) lineItem("Food", food);
    for (const sel of b.addOns?.selections ?? []) {
      const label =
        sel.quantity > 1 ? `${sel.name} ×${sel.quantity}` : sel.name;
      lineItem(label, sel.unitPrice * sel.quantity);
    }
    // Rule above total.
    doc
      .moveTo(left, doc.y + 2)
      .lineTo(right, doc.y + 2)
      .lineWidth(0.5)
      .strokeColor(BRAND.hairline)
      .stroke();
    doc.y += 6;
    lineItem("Total", b.amount, true);

    // Keep addOnsTotal referenced (defensive: total already includes it).
    void addOnsTotal(b);

    doc.y += 8;

    // ---- Payments received ----
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(BRAND.gold)
      .text("Payments received", left, doc.y);
    doc.y += 16;

    const byMethod = collectedByMethod(b);
    let anyPayment = false;
    for (const m of PAYMENT_METHODS) {
      if (byMethod[m] > 0) {
        anyPayment = true;
        lineItem(PAYMENT_METHOD_LABEL[m], byMethod[m]);
      }
    }
    if (!anyPayment) {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(BRAND.muted)
        .text("No payments recorded yet.", left, doc.y);
      doc.y += 15;
    }

    // Balance due (pink + bold when > 0).
    const due = balanceDue(b);
    const y = doc.y + 2;
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(due > 0 ? BRAND.pink : BRAND.ink);
    doc.text("Balance due", left, y, {
      width: amountX - left - 8,
      lineBreak: false,
    });
    doc.text(formatINR(due), amountX, y, {
      width: right - amountX,
      align: "right",
      lineBreak: false,
    });
    doc.y = y + 24;

    // Thank-you line.
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(BRAND.muted)
      .text(
        `${BRAND.name} · ${BRAND.tagline}`,
        left,
        doc.y,
        { width: contentWidth, align: "center" },
      );
    doc.y += 12;
    doc
      .font("Helvetica-Oblique")
      .fontSize(10)
      .fillColor(BRAND.ink)
      .text("Thank you for vibing with us", left, doc.y, {
        width: contentWidth,
        align: "center",
      });
  });
}
