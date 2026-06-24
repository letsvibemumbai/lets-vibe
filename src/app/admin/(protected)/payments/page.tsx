import Link from "next/link";
import {
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";
import { Banknote, CircleDollarSign, QrCode, Smartphone } from "lucide-react";
import {
  listPaymentsLedger,
  type PaymentLedgerFilters,
} from "@/lib/db/payments.server";
import { getPaymentSettings } from "@/lib/db/payment-settings.server";
import { PaymentQrSettings } from "@/components/admin/payments/PaymentQrSettings";
import { PeriodPicker } from "@/components/admin/accounting/PeriodPicker";
import { SCREEN_LABEL, formatINR } from "@/components/admin/dashboard/utils";
import { PAYMENT_METHOD_LABEL } from "@/lib/booking/payments";
import { cn } from "@/lib/utils";
import type { BookingPaymentMethod } from "@/types";

export const metadata = { title: "Payments · Let's Vibe Admin" };
export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;
function pick(sp: SP, key: string): string | undefined {
  const v = sp[key];
  if (Array.isArray(v)) return v[0];
  return v;
}

const METHODS: BookingPaymentMethod[] = ["upi", "cash", "razorpay", "card", "bank"];

const METHOD_CHIP: Record<BookingPaymentMethod, string> = {
  upi: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/25",
  cash: "bg-orange-500/15 text-orange-700 ring-orange-500/25",
  razorpay: "bg-sky-500/15 text-sky-700 ring-sky-500/25",
  card: "bg-violet-500/15 text-violet-700 ring-violet-500/25",
  bank: "bg-slate-500/15 text-slate-700 ring-slate-500/25",
};

function defaultRange(): { from: string; to: string } {
  const now = new Date();
  return {
    from: format(startOfMonth(now), "yyyy-MM-dd"),
    to: format(endOfMonth(now), "yyyy-MM-dd"),
  };
}

function parseFilters(sp: SP): PaymentLedgerFilters & { from: string; to: string } {
  const def = defaultRange();
  const isoRe = /^\d{4}-\d{2}-\d{2}$/;
  const from = pick(sp, "from");
  const to = pick(sp, "to");
  const methodRaw = pick(sp, "method") as BookingPaymentMethod | undefined;
  const method =
    methodRaw && METHODS.includes(methodRaw) ? methodRaw : undefined;
  const resolvedFrom = from && isoRe.test(from) ? from : def.from;
  const resolvedTo = to && isoRe.test(to) ? to : def.to;
  return {
    from: resolvedFrom,
    to: resolvedTo,
    dateFrom: resolvedFrom,
    dateTo: resolvedTo,
    method,
  };
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const { from, to, method } = parseFilters(sp);
  const [ledger, paymentSettings] = await Promise.all([
    listPaymentsLedger({ dateFrom: from, dateTo: to, method }),
    getPaymentSettings(),
  ]);
  const periodLabel = `${format(parseISO(from), "d MMM yyyy")} → ${format(
    parseISO(to),
    "d MMM yyyy",
  )}`;

  function methodHref(m?: BookingPaymentMethod): string {
    const params = new URLSearchParams({ from, to });
    if (m) params.set("method", m);
    return `/admin/payments?${params.toString()}`;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header>
        <h1 className="font-display text-4xl text-foreground">Payments</h1>
        <p className="mt-1 text-sm text-foreground/55">
          Every payment received · {periodLabel}
        </p>
      </header>

      <section className="rounded-3xl bg-card p-6 ring-1 ring-hairline">
        <header className="mb-4 flex items-center gap-2 text-foreground/70">
          <QrCode className="h-4 w-4" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">
            Checkout payment QR
          </h2>
        </header>
        <p className="mb-5 max-w-2xl text-sm text-foreground/55">
          Customers scan this UPI QR at checkout, pay in their UPI app, and
          upload a screenshot. Confirm each booking from its detail page once
          you&rsquo;ve verified the payment.
        </p>
        <PaymentQrSettings settings={paymentSettings} />
      </section>

      <PeriodPicker from={from} to={to} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={<Smartphone className="h-4 w-4" />}
          label="UPI collected"
          value={ledger.byMethod.upi}
          accent="text-emerald-700"
        />
        <SummaryCard
          icon={<Banknote className="h-4 w-4" />}
          label="Cash collected"
          value={ledger.byMethod.cash}
          accent="text-orange-600"
        />
        <SummaryCard
          icon={<CircleDollarSign className="h-4 w-4" />}
          label="Total collected"
          value={ledger.total}
          accent="text-foreground"
          subtitle={`${ledger.count} ${ledger.count === 1 ? "payment" : "payments"}`}
        />
      </div>

      {/* Method filter */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip href={methodHref(undefined)} active={!method}>
          All
        </FilterChip>
        {METHODS.map((m) => (
          <FilterChip key={m} href={methodHref(m)} active={method === m}>
            {PAYMENT_METHOD_LABEL[m]}
          </FilterChip>
        ))}
      </div>

      <section className="rounded-3xl bg-card p-2 ring-1 ring-hairline sm:p-4">
        {ledger.rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-hairline-strong bg-cream/40 px-6 py-12 text-center text-sm text-foreground/55">
            No payments in this period.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-hairline text-left text-[11px] uppercase tracking-wider text-foreground/45">
                  <th className="px-3 py-2 font-medium">When</th>
                  <th className="px-3 py-2 font-medium">Customer</th>
                  <th className="px-3 py-2 font-medium">Room</th>
                  <th className="px-3 py-2 font-medium">Method</th>
                  <th className="px-3 py-2 font-medium">Channel</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {ledger.rows.map((r) => (
                  <tr
                    key={`${r.bookingId}:${r.paymentId}`}
                    className="border-b border-hairline last:border-0"
                  >
                    <td className="px-3 py-2 text-foreground/75">
                      {r.at > 0 ? format(r.at, "d MMM, p") : r.date}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/bookings/${r.bookingId}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {r.customerName}
                      </Link>
                      <span className="ml-2 text-xs text-foreground/50">
                        {r.customerPhone}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-foreground/75">
                      {SCREEN_LABEL[r.screenId]}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2 py-0.5 text-[10.5px] font-medium ring-1 ring-inset",
                          METHOD_CHIP[r.method],
                        )}
                      >
                        {PAYMENT_METHOD_LABEL[r.method]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs capitalize text-foreground/55">
                      {r.channel === "online" ? "Online" : "At venue"}
                    </td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums text-foreground">
                      {formatINR(r.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  accent,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-3xl bg-card p-6 ring-1 ring-hairline">
      <div className="flex items-center gap-2 text-foreground/60">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className={cn("mt-3 font-display text-3xl", accent)}>
        {formatINR(value)}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs text-foreground/55">{subtitle}</p>
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-colors",
        active
          ? "bg-foreground text-background ring-foreground"
          : "bg-card text-foreground/65 ring-hairline-strong hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
