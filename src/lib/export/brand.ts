import "server-only";
import fs from "node:fs";
import path from "node:path";
import { format } from "date-fns";
import PDFDocument from "pdfkit";

/**
 * Shared brand kit for every generated export (Excel + PDF). Colours, logo, and
 * pdfkit header/footer helpers live here so a bookings sheet, a monthly report,
 * and a single receipt all look like they came from the same brand.
 */
export const BRAND = {
  name: "Let's Vibe",
  tagline: "Satya Nagar, Borivali West, Mumbai",
  gold: "#B8860B",
  pink: "#FF4FA3",
  ink: "#1A1A1A",
  muted: "#6B6B6B",
  hairline: "#E6E1D8",
} as const;

// Logo intrinsic dimensions (public/logo.png is 1600×541 transparent PNG).
const LOGO_W = 1600;
const LOGO_H = 541;
const LOGO_ASPECT = LOGO_W / LOGO_H;

// Read the logo off disk once; a null result (missing file / read error) must
// never crash an export, so callers guard on non-null before drawing.
let logoCache: Buffer | null | undefined;

export function loadLogoBuffer(): Buffer | null {
  if (logoCache !== undefined) return logoCache;
  try {
    logoCache = fs.readFileSync(path.join(process.cwd(), "public", "logo.png"));
  } catch {
    logoCache = null;
  }
  return logoCache;
}

/** "d MMM yyyy" (e.g. "13 Jul 2026"). Accepts a Date, epoch ms, or ISO string. */
export function fmtDate(d: Date | number | string): string {
  const date =
    d instanceof Date ? d : typeof d === "number" ? new Date(d) : new Date(d);
  return format(date, "d MMM yyyy");
}

/**
 * Branded page header: logo top-left, big bold ink title, muted subtitle, and a
 * gold rule. Leaves `doc.y` just below the rule so the caller can keep drawing.
 */
export function pdfHeader(
  doc: PDFKit.PDFDocument,
  opts: { title: string; subtitle?: string },
): void {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const top = doc.page.margins.top;

  const logo = loadLogoBuffer();
  const logoHeight = 26;
  const logoWidth = logoHeight * LOGO_ASPECT;
  let textLeft = left;
  if (logo) {
    try {
      doc.image(logo, left, top, { height: logoHeight });
      textLeft = left + logoWidth + 14;
    } catch {
      // A corrupt/unsupported buffer should not abort the whole export.
      textLeft = left;
    }
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(BRAND.ink)
    .text(opts.title, textLeft, top + 1, {
      width: right - textLeft,
      align: "right",
    });
  if (opts.subtitle) {
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(BRAND.muted)
      .text(opts.subtitle, textLeft, doc.y + 1, {
        width: right - textLeft,
        align: "right",
      });
  }

  const ruleY = Math.max(top + logoHeight, doc.y) + 8;
  doc
    .moveTo(left, ruleY)
    .lineTo(right, ruleY)
    .lineWidth(1.5)
    .strokeColor(BRAND.gold)
    .stroke();

  doc.fillColor(BRAND.ink);
  doc.x = left;
  doc.y = ruleY + 12;
}

/**
 * Draw the footer on the current page: a hairline rule, the venue line on the
 * left, and a "Generated {date}" note on the right. Call once per page (or via
 * addPageNumbers for the whole document).
 */
export function pdfFooter(doc: PDFKit.PDFDocument): void {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const y = doc.page.height - doc.page.margins.bottom + 12;

  doc
    .moveTo(left, y)
    .lineTo(right, y)
    .lineWidth(0.5)
    .strokeColor(BRAND.hairline)
    .stroke();

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(BRAND.muted)
    .text(`${BRAND.name} · ${BRAND.tagline}`, left, y + 4, {
      width: (right - left) / 2,
      align: "left",
      lineBreak: false,
    });
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(BRAND.muted)
    .text(`Generated ${fmtDate(new Date())}`, left, y + 4, {
      width: right - left,
      align: "right",
      lineBreak: false,
    });
}

/**
 * After the body is built, walk every buffered page and stamp the footer plus a
 * "Page x of n" line. Requires the doc to be created with `bufferPages: true`.
 */
export function addPageNumbers(doc: PDFKit.PDFDocument): void {
  const range = doc.bufferedPageRange();
  const total = range.count;
  for (let i = range.start; i < range.start + total; i++) {
    doc.switchToPage(i);
    pdfFooter(doc);
    const right = doc.page.width - doc.page.margins.right;
    const left = doc.page.margins.left;
    const y = doc.page.height - doc.page.margins.bottom + 4;
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(BRAND.muted)
      .text(`Page ${i - range.start + 1} of ${total}`, left, y, {
        width: right - left,
        align: "center",
        lineBreak: false,
      });
  }
}

/**
 * Create an A4 pdfkit document, run the caller's `build`, stamp footers + page
 * numbers, and resolve the finished PDF as a single Buffer. Built-in Helvetica
 * fonts only — no font files to bundle.
 */
export function renderPdf(
  build: (doc: PDFKit.PDFDocument) => void,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      build(doc);
      addPageNumbers(doc);
      doc.end();
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}
