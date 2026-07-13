import { type NextRequest } from "next/server";
import { format as formatDate, parseISO } from "date-fns";
import { requireAdmin } from "@/lib/auth/session";
import { getMonthlyReport } from "@/lib/analytics/aggregate";
import { buildReportPdf } from "@/lib/export/reportPdf";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  await requireAdmin();

  const sp = req.nextUrl.searchParams;
  const now = new Date();
  const rawYear = Number(sp.get("year"));
  const rawMonth = Number(sp.get("month"));
  // Clamp to sane bounds so an out-of-range value can't overflow the JS Date
  // range (which would throw a RangeError → unhandled 500).
  const year =
    Number.isFinite(rawYear) && rawYear >= 2000 && rawYear <= 2100
      ? Math.trunc(rawYear)
      : now.getFullYear();
  const month =
    Number.isFinite(rawMonth) && rawMonth >= 1 && rawMonth <= 12
      ? Math.trunc(rawMonth)
      : now.getMonth() + 1;

  const report = await getMonthlyReport(year, month);
  const periodLabel = formatDate(parseISO(report.start), "MMMM yyyy");

  const buffer = await buildReportPdf(report, {
    title: "Monthly report",
    subtitle: `${periodLabel}  ·  ${report.start} → ${report.end}`,
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="report-${year}-${month}.pdf"`,
    },
  });
}
