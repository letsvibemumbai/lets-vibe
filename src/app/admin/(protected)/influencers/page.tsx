import { Award, Megaphone, Users } from "lucide-react";
import { InfluencerTable } from "@/components/admin/influencers/InfluencerTable";
import { formatINR } from "@/components/admin/dashboard/utils";
import { listInfluencers } from "@/lib/db/influencers.server";

export const metadata = { title: "Influencers · Let's Vibe Admin" };
export const dynamic = "force-dynamic";

export default async function AdminInfluencersPage() {
  const rows = await listInfluencers();

  const totalSpend = rows.reduce((s, r) => s + r.amount, 0);
  const excellentCount = rows.filter((r) => r.performance === "excellent").length;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header>
        <h1 className="font-display text-4xl text-foreground">Influencers</h1>
        <p className="mt-1 text-sm text-foreground/55">
          Track collaborations. Each amount is also recorded as a marketing
          expense.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Megaphone className="h-4 w-4" />}
          label="Total spend"
          value={formatINR(totalSpend)}
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Collaborations"
          value={String(rows.length)}
        />
        <StatCard
          icon={<Award className="h-4 w-4" />}
          label="Excellent performers"
          value={String(excellentCount)}
        />
      </div>

      <InfluencerTable rows={rows} />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl bg-card p-6 ring-1 ring-hairline ">
      <div className="flex items-center gap-2 text-foreground/60">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="mt-3 font-display text-3xl text-foreground">{value}</p>
    </div>
  );
}
