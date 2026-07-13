"use client";

import dynamic from "next/dynamic";

export type { RevenueDay } from "./RevenueBarChart.impl";

// recharts is a heavy dependency (~100 KB+). It only renders inside the admin
// dashboard, below the fold, and never on the server. Loading it via
// `next/dynamic` with `ssr:false` splits it into its own chunk and keeps it out
// of the dashboard's initial JS — the page shell paints first, the chart
// hydrates after. The fixed-height skeleton matches the chart container so
// there's no layout shift.
export const RevenueBarChart = dynamic(
  () => import("./RevenueBarChart.impl").then((m) => m.RevenueBarChart),
  {
    ssr: false,
    loading: () => <div className="h-56 w-full animate-pulse rounded-2xl bg-cream/40" />,
  },
);
