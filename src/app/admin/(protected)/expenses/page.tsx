import { format, endOfMonth, endOfYear, startOfMonth, startOfYear } from "date-fns";
import { CalendarDays, Wallet } from "lucide-react";
import { ExpenseFilters } from "@/components/admin/expenses/ExpenseFilters";
import { ExpenseTable } from "@/components/admin/expenses/ExpenseTable";
import { formatINR } from "@/components/admin/dashboard/utils";
import {
  listExpenses,
  getExpensesInRange,
  type ExpenseListFilters,
} from "@/lib/db/expenses.server";
import type {
  ExpenseCategory,
  ExpensePaymentMethod,
} from "@/types";

export const metadata = { title: "Expenses · Let's Vibe Admin" };
export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;
function pick(sp: SP, key: string): string | undefined {
  const v = sp[key];
  if (Array.isArray(v)) return v[0];
  return v;
}

function parseFilters(sp: SP): ExpenseListFilters {
  const category = pick(sp, "category") as ExpenseCategory | undefined;
  const method = pick(sp, "method") as ExpensePaymentMethod | undefined;
  const allowedCategories: ExpenseCategory[] = [
    "utilities",
    "staff",
    "supplies",
    "maintenance",
    "marketing",
    "other",
  ];
  const allowedMethods: ExpensePaymentMethod[] = ["cash", "upi", "card", "bank"];
  return {
    category:
      category && allowedCategories.includes(category) ? category : undefined,
    paymentMethod:
      method && allowedMethods.includes(method) ? method : undefined,
    dateFrom: pick(sp, "from"),
    dateTo: pick(sp, "to"),
  };
}

function sumAmounts(rows: { amount: number }[]): number {
  return rows.reduce((s, r) => s + r.amount, 0);
}

export default async function AdminExpensesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");
  const yearStart = format(startOfYear(now), "yyyy-MM-dd");
  const yearEnd = format(endOfYear(now), "yyyy-MM-dd");

  const [rows, monthExpenses, yearExpenses] = await Promise.all([
    listExpenses(filters),
    getExpensesInRange(monthStart, monthEnd),
    getExpensesInRange(yearStart, yearEnd),
  ]);

  const monthTotal = sumAmounts(monthExpenses);
  const yearTotal = sumAmounts(yearExpenses);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header>
        <h1 className="font-display text-4xl text-foreground">Expenses</h1>
        <p className="mt-1 text-sm text-foreground/55">
          Operating costs. Receipts go to Firebase Storage.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TotalCard
          icon={<CalendarDays className="h-4 w-4" />}
          label={`This month (${format(now, "MMM yyyy")})`}
          value={monthTotal}
          count={monthExpenses.length}
        />
        <TotalCard
          icon={<Wallet className="h-4 w-4" />}
          label={`This year (${format(now, "yyyy")})`}
          value={yearTotal}
          count={yearExpenses.length}
        />
      </div>

      <ExpenseFilters
        category={filters.category}
        paymentMethod={filters.paymentMethod}
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
      />

      <ExpenseTable rows={rows} filters={filters} />
    </div>
  );
}

function TotalCard({
  icon,
  label,
  value,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  count: number;
}) {
  return (
    <div className="rounded-3xl bg-card p-6 ring-1 ring-hairline ">
      <div className="flex items-center gap-2 text-foreground/60">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="mt-3 font-display text-3xl text-foreground">
        {formatINR(value)}
      </p>
      <p className="mt-1 text-xs text-foreground/55">
        {count} {count === 1 ? "entry" : "entries"}
      </p>
    </div>
  );
}
