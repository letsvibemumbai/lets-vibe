"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatINR } from "@/components/admin/dashboard/utils";

type Slice = { key: string; label: string; value: number };

type Props = {
  data: Slice[];
  colors: string[];
  emptyLabel?: string;
};

export function BreakdownPie({ data, colors, emptyLabel = "No data" }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const nonZero = data.filter((d) => d.value > 0);

  if (total === 0 || nonZero.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-2xl bg-cream/40 text-sm text-foreground/55">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={nonZero}
            dataKey="value"
            nameKey="label"
            innerRadius={45}
            outerRadius={75}
            paddingAngle={2}
            stroke="white"
            strokeWidth={2}
          >
            {nonZero.map((d, i) => (
              <Cell key={d.key} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.06)",
              fontSize: 12,
              boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
            }}
            formatter={(value, _name, payload) => {
              const v = typeof value === "number" ? value : 0;
              const label =
                (payload as { payload?: { label?: string } })?.payload?.label ??
                "";
              const pct = total ? Math.round((v / total) * 100) : 0;
              return [`${formatINR(v)} · ${pct}%`, label];
            }}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 11, paddingLeft: 8 }}
            layout="vertical"
            align="right"
            verticalAlign="middle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
