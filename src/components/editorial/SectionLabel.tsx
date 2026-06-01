import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  as?: "span" | "p" | "div";
  tone?: "muted" | "accent" | "ink";
};

/**
 * Small uppercase tracked-out label — the editorial system's section anchor.
 * Used everywhere a section opens: "01 / Screens", "Pricing", "Voices", etc.
 */
export function SectionLabel({
  as: Component = "p",
  tone = "muted",
  className,
  children,
  ...rest
}: Props) {
  return React.createElement(
    Component,
    {
      ...rest,
      className: cn(
        "text-[11px] font-medium uppercase tracking-[0.22em]",
        tone === "muted" && "text-muted",
        tone === "accent" && "text-accent",
        tone === "ink" && "text-ink",
        className,
      ),
    },
    children,
  );
}
