import "server-only";
import ExcelJS from "exceljs";
import { SCREEN_LABEL } from "@/components/admin/dashboard/utils";
import { addOnsTotal, foodRevenue, roomRevenue } from "@/lib/booking/revenue";
import {
  balanceDue,
  collectedByMethod,
  totalCollected,
} from "@/lib/booking/payments";
import type { Booking } from "@/types";
import { BRAND, loadLogoBuffer } from "./brand";

/** "Cake ×2 | Rose petals" — the booking's add-on selections as a flat string. */
function addOnsText(b: Booking): string {
  const sels = b.addOns?.selections ?? [];
  return sels
    .map((s) => (s.quantity > 1 ? `${s.name} x${s.quantity}` : s.name))
    .join(" | ");
}

const CURRENCY_FMT = "#,##0";

/**
 * Branded bookings workbook: logo + title band, a styled header row (frozen),
 * one row per booking with the full money breakdown, and a bold TOTALS row.
 */
export async function buildBookingsWorkbook(
  rows: Booking[],
  meta: { title: string; subtitle: string },
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Let's Vibe";
  wb.created = new Date();
  const ws = wb.addWorksheet("Bookings", {
    views: [{ state: "frozen", ySplit: 4 }],
  });

  // Column layout (widths tuned for readability).
  ws.columns = [
    { key: "date", width: 12 },
    { key: "time", width: 14 },
    { key: "screen", width: 18 },
    { key: "customer", width: 22 },
    { key: "phone", width: 15 },
    { key: "guests", width: 8 },
    { key: "room", width: 12 },
    { key: "food", width: 12 },
    { key: "addons", width: 12 },
    { key: "total", width: 12 },
    { key: "collected", width: 12 },
    { key: "outstanding", width: 13 },
    { key: "upi", width: 11 },
    { key: "cash", width: 11 },
    { key: "status", width: 12 },
    { key: "source", width: 10 },
    { key: "addonsText", width: 32 },
  ];

  const lastCol = ws.columnCount; // 17
  const goldArgb = "FF" + BRAND.gold.slice(1).toUpperCase();
  const mutedArgb = "FF" + BRAND.muted.slice(1).toUpperCase();
  const inkArgb = "FF" + BRAND.ink.slice(1).toUpperCase();
  const cream = "FFF7F2E9";

  // Row 1: logo image + title.
  const logo = loadLogoBuffer();
  if (logo) {
    // exceljs bundles its own `Buffer` type (declared as `extends ArrayBuffer`)
    // that diverges from @types/node's; the runtime accepts a Node Buffer, so
    // bridge the type boundary via ArrayBuffer.
    const imgId = wb.addImage({
      buffer: logo as unknown as ArrayBuffer,
      extension: "png",
    });
    ws.addImage(imgId, {
      tl: { col: 0, row: 0 },
      ext: { width: 130, height: 44 },
    });
  }
  ws.mergeCells(1, 3, 1, lastCol);
  const titleCell = ws.getCell(1, 3);
  titleCell.value = meta.title;
  titleCell.font = { bold: true, size: 16, color: { argb: goldArgb } };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  ws.getRow(1).height = 34;

  // Row 2: subtitle.
  ws.mergeCells(2, 1, 2, lastCol);
  const subCell = ws.getCell(2, 1);
  subCell.value = meta.subtitle;
  subCell.font = { italic: true, size: 10, color: { argb: mutedArgb } };

  // Row 3: blank spacer.

  // Row 4: header row.
  const headers = [
    "Date",
    "Time",
    "Screen",
    "Customer",
    "Phone",
    "Guests",
    "Room ₹",
    "Food ₹",
    "Add-ons ₹",
    "Total ₹",
    "Collected ₹",
    "Outstanding ₹",
    "UPI ₹",
    "Cash ₹",
    "Status",
    "Source",
    "Add-ons",
  ];
  const headerRow = ws.getRow(4);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 10, color: { argb: inkArgb } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: cream },
    };
    cell.border = {
      bottom: { style: "thin", color: { argb: goldArgb } },
    };
    cell.alignment = { vertical: "middle" };
  });
  headerRow.height = 18;

  // Currency columns (1-based): Room..Cash → 7..14.
  const currencyCols = [7, 8, 9, 10, 11, 12, 13, 14];

  const totals = {
    room: 0,
    food: 0,
    addons: 0,
    total: 0,
    collected: 0,
    outstanding: 0,
    upi: 0,
    cash: 0,
  };

  for (const b of rows) {
    const byMethod = collectedByMethod(b);
    const room = roomRevenue(b);
    const food = foodRevenue(b);
    const addons = addOnsTotal(b);
    const collected = totalCollected(b);
    const outstanding = balanceDue(b);

    totals.room += room;
    totals.food += food;
    totals.addons += addons;
    totals.total += b.amount;
    totals.collected += collected;
    totals.outstanding += outstanding;
    totals.upi += byMethod.upi;
    totals.cash += byMethod.cash;

    const row = ws.addRow([
      b.date,
      `${b.startTime}–${b.endTime}`,
      SCREEN_LABEL[b.screenId],
      b.customerName,
      b.customerPhone,
      b.guestCount,
      room,
      food,
      addons,
      b.amount,
      collected,
      outstanding,
      byMethod.upi,
      byMethod.cash,
      b.status,
      b.source,
      addOnsText(b),
    ]);
    for (const c of currencyCols) row.getCell(c).numFmt = CURRENCY_FMT;
    row.getCell(15).alignment = { horizontal: "left" };
    row.getCell(16).alignment = { horizontal: "left" };
  }

  // TOTALS row.
  const totalsRow = ws.addRow([
    "TOTALS",
    "",
    "",
    "",
    "",
    "",
    totals.room,
    totals.food,
    totals.addons,
    totals.total,
    totals.collected,
    totals.outstanding,
    totals.upi,
    totals.cash,
    "",
    "",
    "",
  ]);
  totalsRow.font = { bold: true };
  for (const c of currencyCols) {
    const cell = totalsRow.getCell(c);
    cell.numFmt = CURRENCY_FMT;
    cell.font = { bold: true };
  }
  totalsRow.eachCell((cell) => {
    cell.border = {
      top: { style: "thin", color: { argb: goldArgb } },
    };
  });

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
