import "server-only";
import { formatINR } from "@/components/admin/dashboard/utils";
import type { MonthlyReport } from "@/lib/analytics/aggregate";
import { BRAND, pdfHeader, renderPdf } from "./brand";

type Bucket = { key: string; label: string; value: number };

/**
 * Branded monthly report PDF: P&L summary, revenue/collection/expense buckets,
 * and a daily-breakdown table. Uses `renderPdf` so footers + page numbers are
 * stamped automatically; sections wrap to new pages as the cursor advances.
 */
export async function buildReportPdf(
  report: MonthlyReport,
  meta: { title: string; subtitle: string },
): Promise<Buffer> {
  return renderPdf((doc) => {
    pdfHeader(doc, { title: meta.title, subtitle: meta.subtitle });

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const contentWidth = right - left;
    const bottomLimit = doc.page.height - doc.page.margins.bottom - 24;

    const ensureSpace = (needed: number) => {
      if (doc.y + needed > bottomLimit) {
        doc.addPage();
        doc.y = doc.page.margins.top;
      }
    };

    const sectionHeading = (title: string) => {
      ensureSpace(30);
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(BRAND.gold)
        .text(title, left, doc.y);
      doc.y += 2;
      doc
        .moveTo(left, doc.y)
        .lineTo(right, doc.y)
        .lineWidth(0.5)
        .strokeColor(BRAND.hairline)
        .stroke();
      doc.y += 8;
      doc.fillColor(BRAND.ink);
    };

    // Label / value pair on one line.
    const pair = (label: string, value: string) => {
      ensureSpace(16);
      const y = doc.y;
      doc.font("Helvetica").fontSize(9).fillColor(BRAND.muted);
      doc.text(label, left, y, { width: contentWidth / 2, lineBreak: false });
      doc.font("Helvetica-Bold").fontSize(9).fillColor(BRAND.ink);
      doc.text(value, left, y, {
        width: contentWidth,
        align: "right",
        lineBreak: false,
      });
      doc.y = y + 14;
    };

    // ---- P&L summary ----
    sectionHeading("P&L summary");
    pair("Total billed", formatINR(report.totals.revenue));
    pair("Income (room)", formatINR(report.totals.roomRevenue));
    pair("Food", formatINR(report.totals.foodRevenue));
    pair("Add-ons", formatINR(report.totals.addOnRevenue));
    pair("Expenses", formatINR(report.totals.expenses));
    pair("Net", formatINR(report.totals.net));
    pair("Collected", formatINR(report.totals.collected));
    pair("Outstanding (due at venue)", formatINR(report.totals.outstanding));
    doc.y += 6;

    // Compact two-column bucket list (label … value), one item per line.
    const bucketList = (title: string, buckets: Bucket[]) => {
      sectionHeading(title);
      for (const b of buckets) {
        ensureSpace(14);
        const y = doc.y;
        doc.font("Helvetica").fontSize(9).fillColor(BRAND.muted);
        doc.text(b.label, left, y, {
          width: contentWidth / 2,
          lineBreak: false,
        });
        doc.font("Helvetica").fontSize(9).fillColor(BRAND.ink);
        doc.text(formatINR(b.value), left, y, {
          width: contentWidth,
          align: "right",
          lineBreak: false,
        });
        doc.y = y + 12;
      }
      doc.y += 6;
    };

    bucketList("Revenue by screen", report.revenueByScreen);
    bucketList("Revenue by source", report.revenueBySource);
    bucketList("Revenue by duration", report.revenueByDuration);
    bucketList("Collected by method", report.collectedByMethod);
    bucketList("Expenses by category", report.expensesByCategory);

    // ---- Daily breakdown table ----
    sectionHeading("Daily breakdown");
    const cols = [
      { label: "Date", width: 110, align: "left" as const },
      { label: "Bookings", width: 90, align: "right" as const },
      { label: "Revenue", width: 130, align: "right" as const },
      { label: "Expenses", width: contentWidth - 330, align: "right" as const },
    ];
    const drawDailyHeader = () => {
      const y = doc.y;
      let x = left;
      doc.font("Helvetica-Bold").fontSize(8).fillColor(BRAND.ink);
      for (const c of cols) {
        doc.text(c.label, x, y, {
          width: c.width,
          align: c.align,
          lineBreak: false,
        });
        x += c.width;
      }
      doc.y = y + 14;
      doc
        .moveTo(left, doc.y - 2)
        .lineTo(right, doc.y - 2)
        .lineWidth(0.5)
        .strokeColor(BRAND.gold)
        .stroke();
    };
    drawDailyHeader();

    doc.font("Helvetica").fontSize(8).fillColor(BRAND.ink);
    for (const d of report.daily) {
      if (doc.y + 13 > bottomLimit) {
        doc.addPage();
        doc.y = doc.page.margins.top;
        drawDailyHeader();
        doc.font("Helvetica").fontSize(8).fillColor(BRAND.ink);
      }
      const y = doc.y;
      const cells = [
        d.date,
        String(d.bookings),
        d.revenue > 0 ? formatINR(d.revenue) : "—",
        d.expenses > 0 ? formatINR(d.expenses) : "—",
      ];
      let x = left;
      cells.forEach((text, i) => {
        doc.text(text, x, y, {
          width: cols[i].width,
          align: cols[i].align,
          lineBreak: false,
        });
        x += cols[i].width;
      });
      doc.y = y + 13;
    }
  });
}
