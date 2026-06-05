import { format, parseISO } from "date-fns";
import { getMonthlyReport } from "@/lib/analytics/aggregate";
import { ReportToolbar } from "@/components/admin/reports/ReportToolbar";
import {
  SCREEN_LABEL,
  STATUS_STYLES,
  formatINR,
  summarizeAddOns,
} from "@/components/admin/dashboard/utils";
import { cn } from "@/lib/utils";

export const metadata = { title: "Monthly report · Let's Vibe Admin" };
export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;
function pick(sp: SP, key: string): string | undefined {
  const v = sp[key];
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const year = Number(pick(sp, "year")) || now.getFullYear();
  const month = Number(pick(sp, "month")) || now.getMonth() + 1;
  const report = await getMonthlyReport(year, month);
  const periodLabel = format(parseISO(report.start), "MMMM yyyy");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          html, body { background: white !important; }
          [data-print-hide] { display: none !important; }
          [data-print-page] {
            background: white !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          [data-print-section] {
            page-break-inside: avoid;
            box-shadow: none !important;
            border: 1px solid rgba(0,0,0,0.08) !important;
          }
        }
      `}</style>

      <div data-print-hide>
        <ReportToolbar
          year={year}
          month={month}
          start={report.start}
          end={report.end}
        />
      </div>

      <div
        data-print-page
        className="space-y-6 rounded-3xl bg-card p-6 ring-1 ring-hairline "
      >
        <header className="border-b border-hairline-strong pb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
            Let&rsquo;s Vibe · Monthly report
          </p>
          <h1 className="mt-1 font-display text-4xl text-foreground">
            {periodLabel}
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            {report.start} → {report.end}
          </p>
        </header>

        <Section title="P&L summary" data-print-section="">
          <div className="grid grid-cols-3 gap-4">
            <StatBlock label="Revenue" value={report.totals.revenue} tone="up" />
            <StatBlock
              label="Expenses"
              value={report.totals.expenses}
              tone="down"
            />
            <StatBlock
              label="Net"
              value={report.totals.net}
              tone={report.totals.net >= 0 ? "up" : "down"}
            />
          </div>
          <p className="mt-3 text-xs text-foreground/55">
            {report.totals.bookingCount} revenue-earning bookings ·{" "}
            {report.totals.expenseCount} expense entries
          </p>
        </Section>

        <div className="grid gap-6 md:grid-cols-2">
          <BucketTable
            title="Revenue by screen"
            data={report.revenueByScreen}
            total={report.totals.revenue}
          />
          <BucketTable
            title="Revenue by source"
            data={report.revenueBySource}
            total={report.totals.revenue}
          />
          <BucketTable
            title="Revenue by duration"
            data={report.revenueByDuration}
            total={report.totals.revenue}
          />
          <BucketTable
            title="Expenses by category"
            data={report.expensesByCategory}
            total={report.totals.expenses}
          />
        </div>

        <Section title="Daily breakdown" data-print-section="">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-hairline text-left text-[11px] uppercase tracking-wider text-foreground/45">
                  <th className="py-2 pr-3 font-medium">Date</th>
                  <th className="py-2 pr-3 font-medium">Bookings</th>
                  <th className="py-2 pr-3 font-medium">Revenue</th>
                  <th className="py-2 pr-3 font-medium">Expenses</th>
                  <th className="py-2 font-medium">Net</th>
                </tr>
              </thead>
              <tbody>
                {report.daily.map((d) => (
                  <tr key={d.date} className="border-b border-hairline">
                    <td className="py-1.5 pr-3 text-foreground/75">{d.date}</td>
                    <td className="py-1.5 pr-3 text-foreground/75">
                      {d.bookings}
                    </td>
                    <td className="py-1.5 pr-3 text-emerald-700">
                      {d.revenue > 0 ? formatINR(d.revenue) : "—"}
                    </td>
                    <td className="py-1.5 pr-3 text-rose-700">
                      {d.expenses > 0 ? formatINR(d.expenses) : "—"}
                    </td>
                    <td className="py-1.5 font-medium text-foreground">
                      {formatINR(d.revenue - d.expenses)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section
          title={`All bookings (${report.bookings.length})`}
          data-print-section=""
        >
          {report.bookings.length === 0 ? (
            <EmptyRow>No bookings this month.</EmptyRow>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-hairline text-left text-[11px] uppercase tracking-wider text-foreground/45">
                    <th className="py-2 pr-3 font-medium">Date</th>
                    <th className="py-2 pr-3 font-medium">Time</th>
                    <th className="py-2 pr-3 font-medium">Screen</th>
                    <th className="py-2 pr-3 font-medium">Customer</th>
                    <th className="py-2 pr-3 font-medium">Hrs</th>
                    <th className="py-2 pr-3 font-medium">Amount</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {report.bookings.map((b) => {
                    const s = STATUS_STYLES[b.status];
                    const addOns = summarizeAddOns(b.addOns);
                    return (
                      <tr key={b.id} className="border-b border-hairline">
                        <td className="py-1.5 pr-3 text-foreground/75">
                          {b.date}
                        </td>
                        <td className="py-1.5 pr-3 text-foreground/75">
                          {b.startTime}–{b.endTime}
                        </td>
                        <td className="py-1.5 pr-3 text-foreground/75">
                          {SCREEN_LABEL[b.screenId]}
                        </td>
                        <td className="py-1.5 pr-3 text-foreground">
                          <span className="font-medium">{b.customerName}</span>
                          <span className="ml-2 text-xs text-foreground/55">
                            {b.customerPhone}
                          </span>
                          {addOns && (
                            <span className="block text-xs text-foreground/50">
                              {addOns}
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 pr-3 text-foreground/75">
                          {b.duration}
                        </td>
                        <td className="py-1.5 pr-3 font-medium text-foreground">
                          {formatINR(b.amount)}
                        </td>
                        <td className="py-1.5 pr-3">
                          <span
                            className={cn(
                              "inline-block rounded-full px-2 py-0.5 text-[10.5px] font-medium ring-1 ring-inset",
                              s.bg,
                              s.text,
                              s.border,
                            )}
                          >
                            {s.label}
                          </span>
                        </td>
                        <td className="py-1.5 text-xs capitalize text-foreground/55">
                          {b.source}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section
          title={`All expenses (${report.expenses.length})`}
          data-print-section=""
        >
          {report.expenses.length === 0 ? (
            <EmptyRow>No expenses this month.</EmptyRow>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-hairline text-left text-[11px] uppercase tracking-wider text-foreground/45">
                    <th className="py-2 pr-3 font-medium">Date</th>
                    <th className="py-2 pr-3 font-medium">Category</th>
                    <th className="py-2 pr-3 font-medium">Description</th>
                    <th className="py-2 pr-3 font-medium">Method</th>
                    <th className="py-2 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {report.expenses.map((e) => (
                    <tr key={e.id} className="border-b border-hairline">
                      <td className="py-1.5 pr-3 text-foreground/75">
                        {e.date}
                      </td>
                      <td className="py-1.5 pr-3 capitalize text-foreground/75">
                        {e.category}
                      </td>
                      <td className="py-1.5 pr-3 text-foreground">
                        {e.description}
                      </td>
                      <td className="py-1.5 pr-3 text-xs uppercase text-foreground/55">
                        {e.paymentMethod}
                      </td>
                      <td className="py-1.5 font-medium text-foreground">
                        {formatINR(e.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  ...rest
}: {
  title: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      className="rounded-2xl border border-hairline p-5"
      {...rest}
    >
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground/70">
        {title}
      </h2>
      {children}
    </section>
  );
}

function StatBlock({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "up" | "down";
}) {
  const color = tone === "up" ? "text-emerald-700" : "text-rose-700";
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-foreground/55">
        {label}
      </p>
      <p className={cn("mt-1 font-display text-2xl", color)}>
        {formatINR(value)}
      </p>
    </div>
  );
}

function BucketTable({
  title,
  data,
  total,
}: {
  title: string;
  data: { key: string; label: string; value: number }[];
  total: number;
}) {
  return (
    <Section title={title} data-print-section="">
      <table className="w-full text-sm">
        <tbody>
          {data.map((d) => {
            const pct = total ? Math.round((d.value / total) * 100) : 0;
            return (
              <tr key={d.key} className="border-b border-hairline">
                <td className="py-1.5 text-foreground/75">{d.label}</td>
                <td className="py-1.5 text-right text-foreground">
                  {formatINR(d.value)}
                </td>
                <td className="py-1.5 pl-3 text-right text-xs text-foreground/50">
                  {pct}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Section>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-hairline-strong bg-cream/40 px-6 py-8 text-center text-sm text-foreground/55">
      {children}
    </p>
  );
}
