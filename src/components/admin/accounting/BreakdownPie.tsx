"use client";

import dynamic from "next/dynamic";

// recharts is heavy (~100 KB+) and only powers the admin accounting pie charts,
// which render client-side below the fold. `next/dynamic` with `ssr:false`
// splits it into its own chunk and out of the page's initial JS. The skeleton
// matches the chart's h-64 container so nothing shifts when it hydrates.
export const BreakdownPie = dynamic(
  () => import("./BreakdownPie.impl").then((m) => m.BreakdownPie),
  {
    ssr: false,
    loading: () => <div className="h-64 w-full animate-pulse rounded-2xl bg-cream/40" />,
  },
);
