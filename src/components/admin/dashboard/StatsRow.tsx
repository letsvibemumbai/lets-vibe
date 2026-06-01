import {
  AlertTriangle,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
} from "lucide-react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { cn } from "@/lib/utils";
import type { Totals } from "@/lib/admin/dashboard.server";
import { formatINR } from "./utils";

type Props = {
  today: Totals;
  week: Totals;
  month: Totals;
  pendingCount: number;
};

const TILTS = [0, 0, 0, 0];

export function StatsRow({ today, week, month, pendingCount }: Props) {
  const pendingAlert = pendingCount > 0;
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={CalendarCheck}
        label="Today"
        count={today.count}
        revenue={today.revenue}
        tilt={TILTS[0]}
        accent="bg-card"
      />
      <StatCard
        icon={CalendarRange}
        label="This week"
        count={week.count}
        revenue={week.revenue}
        tilt={TILTS[1]}
        accent="bg-card"
      />
      <StatCard
        icon={CalendarDays}
        label="This month"
        count={month.count}
        revenue={month.revenue}
        tilt={TILTS[2]}
        accent="bg-card"
      />
      <PendingCard count={pendingCount} alert={pendingAlert} tilt={TILTS[3]} />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  count,
  revenue,
  tilt,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  revenue: number;
  tilt: number;
  accent: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-hairline-strong p-5  transition-transform hover:rotate-0",
        accent,
      )}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div className="flex items-center gap-2 text-foreground/70">
        <Icon className="h-4 w-4" strokeWidth={2.5} />
        <span className="text-xl leading-none">{label}</span>
      </div>
      <div className="mt-3 flex items-baseline gap-2 font-display text-4xl leading-none">
        <NumberTicker value={count} className="text-foreground" />
        <span className="font-body text-sm font-semibold text-foreground/55">
          {count === 1 ? "booking" : "bookings"}
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold text-accent">
        {formatINR(revenue)}
      </p>
    </div>
  );
}

function PendingCard({
  count,
  alert,
  tilt,
}: {
  count: number;
  alert: boolean;
  tilt: number;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5",
        alert ? "border-accent/50 bg-accent/10" : "border-hairline-strong bg-card",
      )}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div className="flex items-center gap-2 text-foreground/70">
        <AlertTriangle className="h-4 w-4" strokeWidth={2.5} />
        <span className="text-xl leading-none">Pending {">"} 30m</span>
      </div>
      <div className="mt-3 flex items-baseline gap-2 font-display text-4xl leading-none">
        <NumberTicker value={count} className="text-foreground" />
        <span className="font-body text-sm font-semibold text-foreground/55">
          {count === 1 ? "booking" : "bookings"}
        </span>
      </div>
      <p className="mt-2 text-xs text-foreground/70">
        {alert
          ? "Awaiting payment — likely abandoned."
          : "No stale pending bookings."}
      </p>
    </div>
  );
}
