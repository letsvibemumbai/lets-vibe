"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTimeFormat } from "./TimeFormatProvider";

/**
 * Switches the whole app's time display between 12-hour and 24-hour. The
 * preference is stored in a cookie, so it sticks across sessions and applies
 * everywhere `<TimeText>` / `<TimeRange>` / `<HourText>` render.
 */
export function TimeFormatToggle({
  className,
  tone = "site",
}: {
  className?: string;
  tone?: "site" | "admin";
}) {
  const { format, toggle } = useTimeFormat();
  const other = format === "12" ? "24" : "12";
  return (
    <button
      type="button"
      onClick={toggle}
      data-cursor="cta"
      aria-label={`Switch to ${other}-hour time`}
      title={`Showing ${format}-hour time — tap for ${other}-hour`}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold tabular-nums transition-colors",
        tone === "admin"
          ? "text-foreground ring-1 ring-hairline-strong hover:bg-accent hover:text-accent-foreground"
          : "text-ink/75 hover:bg-ink/5 hover:text-ink",
        className,
      )}
    >
      <Clock className="h-4 w-4" strokeWidth={1.75} />
      {format === "12" ? "12h" : "24h"}
    </button>
  );
}
