"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type RevenueDay = { date: string; revenue: number };

type Props = {
  data: RevenueDay[];
};

function formatRupeesShort(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${n}`;
}

function formatRupees(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function RevenueBarChart({ data }: Props) {
  const chartData = data.map((d) => ({
    day: Number(d.date.slice(-2)),
    revenue: d.revenue,
    date: d.date,
  }));
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 8, bottom: 0, left: -10 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(0,0,0,0.06)"
            vertical={false}
          />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: "rgba(0,0,0,0.5)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "rgba(0,0,0,0.5)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatRupeesShort}
            width={48}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,192,203,0.15)" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.06)",
              fontSize: 12,
              boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
            }}
            labelFormatter={(label, payload) => {
              const date = payload?.[0]?.payload?.date as string | undefined;
              return date ?? `Day ${label}`;
            }}
            formatter={(value) => [
              formatRupees(typeof value === "number" ? value : 0),
              "Revenue",
            ]}
          />
          <Bar
            dataKey="revenue"
            fill="var(--accent)"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
