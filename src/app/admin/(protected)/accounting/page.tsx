import {
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";
import {
  ArrowDownRight,
  ArrowUpRight,
  Scale,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  getExpensesByCategory,
  getRevenueByScreen,
  getRevenueBySource,
} from "@/lib/analytics/aggregate";
import { PeriodPicker } from "@/components/admin/accounting/PeriodPicker";
import { BreakdownPie } from "@/components/admin/accounting/BreakdownPie";
import { formatINR } from "@/components/admin/dashboard/utils";
import { cn } from "@/lib/utils";

export const metadata = { title: "Accounting · Let's Vibe Admin" };
export const dynamic = "force-dynamic";

const SCREEN_COLORS = ["#FB923C", "#10B981", "#0F766E"]; // beach orange, grass emerald, forest teal
const SOURCE_COLORS = ["#FFE45C", "#FFC0CB"]; // brand yellow, brand pink
const CATEGORY_COLORS = [
  "#FFC0CB", // pink
  "#FFE45C", // yellow
  "#10B981", // emerald
  "#38BDF8", // sky
  "#A78BFA", // violet
  "#94A3B8", // slate
];

type SP = Record<string, string | string[] | undefined>;
function pick(sp: SP, key: string): string | undefined {
  const v = sp[key];
  if (Array.isArray(v)) return v[0];
  return v;
}

function defaultRange(): { from: string; to: string } {
  const now = new Date();
  return {
    from: format(startOfMonth(now), "yyyy-MM-dd"),
    to: format(endOfMonth(now), "yyyy-MM-dd"),
  };
}

function parseRange(sp: SP): { from: string; to: string } {
  const def = defaultRange();
  const isoRe = /^\d{4}-\d{2}-\d{2}$/;
  const from = pick(sp, "from");
  const to = pick(sp, "to");
  return {
    from: from && isoRe.test(from) ? from : def.from,
    to: to && isoRe.test(to) ? to : def.to,
  };
}

export default async function AdminAccountingPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const { from, to } = parseRange(sp);

  const [revenueByScreen, revenueBySource, expensesByCategory] = await Promise.all([
    getRevenueByScreen(from, to),
    getRevenueBySource(from, to),
    getExpensesByCategory(from, to),
  ]);

  const totalRevenue = revenueByScreen.reduce((s, b) => s + b.value, 0);
  const totalExpenses = expensesByCategory.reduce((s, b) => s + b.value, 0);
  const net = totalRevenue - totalExpenses;
  const periodLabel = `${format(parseISO(from), "d MMM yyyy")} → ${format(
    parseISO(to),
    "d MMM yyyy",
  )}`;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <h1 className="font-display text-4xl text-foreground">Accounting</h1>
        <p className="mt-1 text-sm text-foreground/55">{periodLabel}</p>
      </header>

      <PeriodPicker from={from} to={to} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={<ArrowUpRight className="h-4 w-4" />}
          label="Total revenue"
          value={totalRevenue}
          tone="up"
          subtitle="Confirmed + completed bookings"
        />
        <SummaryCard
          icon={<ArrowDownRight className="h-4 w-4" />}
          label="Total expenses"
          value={totalExpenses}
          tone="down"
          subtitle={`${expensesByCategory.reduce((s, b) => s + (b.value > 0 ? 1 : 0), 0)} categories`}
        />
        <SummaryCard
          icon={<Scale className="h-4 w-4" />}
          label="Net profit/loss"
          value={net}
          tone={net >= 0 ? "up" : "down"}
          subtitle={net >= 0 ? "In the black" : "In the red"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <PieCard
          title="Revenue by screen"
          icon={<TrendingUp className="h-4 w-4" />}
          data={revenueByScreen}
          colors={SCREEN_COLORS}
          total={totalRevenue}
        />
        <PieCard
          title="Revenue by source"
          icon={<TrendingUp className="h-4 w-4" />}
          data={revenueBySource}
          colors={SOURCE_COLORS}
          total={totalRevenue}
        />
        <PieCard
          title="Expenses by category"
          icon={<Wallet className="h-4 w-4" />}
          data={expensesByCategory}
          colors={CATEGORY_COLORS}
          total={totalExpenses}
        />
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "up" | "down";
  subtitle: string;
}) {
  const toneColor =
    tone === "up" ? "text-emerald-700" : "text-rose-700";
  return (
    <div className="rounded-3xl bg-card p-6 ring-1 ring-white/10 ">
      <div className={cn("flex items-center gap-2", toneColor)}>
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className={cn("mt-3 font-display text-3xl", toneColor)}>
        {formatINR(value)}
      </p>
      <p className="mt-1 text-xs text-foreground/55">{subtitle}</p>
    </div>
  );
}

function PieCard({
  title,
  icon,
  data,
  colors,
  total,
}: {
  title: string;
  icon: React.ReactNode;
  data: { key: string; label: string; value: number }[];
  colors: string[];
  total: number;
}) {
  return (
    <section className="rounded-3xl bg-card p-6 ring-1 ring-white/10 ">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-foreground/70">
          {icon}
          <h2 className="text-sm font-semibold uppercase tracking-wider">
            {title}
          </h2>
        </div>
        <p className="text-xs font-medium text-foreground/70">
          {formatINR(total)}
        </p>
      </header>
      <div className="mt-4">
        <BreakdownPie data={data} colors={colors} />
      </div>
    </section>
  );
}
