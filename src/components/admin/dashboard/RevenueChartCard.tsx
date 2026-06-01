import { TrendingUp } from "lucide-react";
import { RevenueBarChart, type RevenueDay } from "./RevenueBarChart";
import { formatINR } from "./utils";

type Props = {
  data: RevenueDay[];
};

export function RevenueChartCard({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.revenue, 0);
  return (
    <section className="rounded-3xl bg-card p-6 ring-1 ring-white/10 ">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-foreground/70" />
          <h2 className="font-display text-2xl">Revenue this month</h2>
        </div>
        <p className="text-sm font-semibold text-foreground">
          {formatINR(total)}
        </p>
      </header>
      <div className="mt-4">
        <RevenueBarChart data={data} />
      </div>
    </section>
  );
}
