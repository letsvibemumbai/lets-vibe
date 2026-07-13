import "server-only";
import { SCREEN_LABEL, formatINR } from "@/components/admin/dashboard/utils";
import { balanceDue, totalCollected } from "@/lib/booking/payments";
import type { Booking } from "@/types";
import { BRAND, pdfHeader, renderPdf } from "./brand";

type Col = {
  label: string;
  width: number;
  align: "left" | "right";
  value: (b: Booking) => string;
};

// Portrait A4 content width is ~515pt (595 − 2×40 margin). Columns sum to ~515.
const COLUMNS: Col[] = [
  { label: "Date", width: 62, align: "left", value: (b) => b.date },
  {
    label: "Time",
    width: 72,
    align: "left",
    value: (b) => `${b.startTime}–${b.endTime}`,
  },
  {
    label: "Screen",
    width: 88,
    align: "left",
    value: (b) => SCREEN_LABEL[b.screenId],
  },
  {
    label: "Customer",
    width: 96,
    align: "left",
    value: (b) => b.customerName,
  },
  {
    label: "Guests",
    width: 40,
    align: "right",
    value: (b) => String(b.guestCount),
  },
  { label: "Total", width: 58, align: "right", value: (b) => formatINR(b.amount) },
  {
    label: "Collected",
    width: 58,
    align: "right",
    value: (b) => formatINR(totalCollected(b)),
  },
  {
    label: "Outst.",
    width: 58,
    align: "right",
    value: (b) => formatINR(balanceDue(b)),
  },
  { label: "Status", width: 56, align: "left", value: (b) => b.status },
];

const ROW_HEIGHT = 16;
const HEADER_HEIGHT = 18;

/**
 * Branded bookings list PDF: brand header, a paginated grid table, and a totals
 * line. Wraps to new pages when the cursor nears the bottom, redrawing the
 * column header on each page.
 */
export async function buildBookingsPdf(
  rows: Booking[],
  meta: { title: string; subtitle: string },
): Promise<Buffer> {
  return renderPdf((doc) => {
    pdfHeader(doc, { title: meta.title, subtitle: meta.subtitle });

    const left = doc.page.margins.left;
    const bottomLimit = doc.page.height - doc.page.margins.bottom - 24;

    const drawHeader = () => {
      let x = left;
      const y = doc.y;
      doc.font("Helvetica-Bold").fontSize(8).fillColor(BRAND.ink);
      for (const col of COLUMNS) {
        doc.text(col.label, x + 2, y + 4, {
          width: col.width - 4,
          align: col.align,
          lineBreak: false,
        });
        x += col.width;
      }
      const ruleY = y + HEADER_HEIGHT - 2;
      doc
        .moveTo(left, ruleY)
        .lineTo(x, ruleY)
        .lineWidth(1)
        .strokeColor(BRAND.gold)
        .stroke();
      doc.y = y + HEADER_HEIGHT;
    };

    drawHeader();

    doc.font("Helvetica").fontSize(8).fillColor(BRAND.ink);
    let totTotal = 0;
    let totCollected = 0;
    let totOutstanding = 0;

    for (const b of rows) {
      if (doc.y + ROW_HEIGHT > bottomLimit) {
        doc.addPage();
        doc.y = doc.page.margins.top;
        drawHeader();
        doc.font("Helvetica").fontSize(8).fillColor(BRAND.ink);
      }
      const y = doc.y;
      let x = left;
      for (const col of COLUMNS) {
        doc.text(col.value(b), x + 2, y + 3, {
          width: col.width - 4,
          align: col.align,
          lineBreak: false,
          ellipsis: true,
        });
        x += col.width;
      }
      doc
        .moveTo(left, y + ROW_HEIGHT - 1)
        .lineTo(x, y + ROW_HEIGHT - 1)
        .lineWidth(0.4)
        .strokeColor(BRAND.hairline)
        .stroke();
      doc.y = y + ROW_HEIGHT;

      totTotal += b.amount;
      totCollected += totalCollected(b);
      totOutstanding += balanceDue(b);
    }

    // Totals line.
    if (doc.y + ROW_HEIGHT + 6 > bottomLimit) {
      doc.addPage();
      doc.y = doc.page.margins.top;
    }
    const y = doc.y + 4;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(BRAND.ink);
    const summary = `${rows.length} bookings   ·   Total ${formatINR(
      totTotal,
    )}   ·   Collected ${formatINR(totCollected)}   ·   Outstanding ${formatINR(
      totOutstanding,
    )}`;
    const right = doc.page.width - doc.page.margins.right;
    doc.text(summary, left, y, { width: right - left, align: "right" });
  });
}
