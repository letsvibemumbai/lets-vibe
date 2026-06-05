import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Rolling text — on hover of the nearest `group`, the label rolls up and out
 * while an identical copy rolls up into its place. Pure CSS (no JS), so it's
 * cheap and works anywhere. Place inside a `group` element (e.g. a link).
 * Respects reduced-motion via the global transition override.
 */
export function RollingText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ease = "cubic-bezier(0.65,0.05,0.36,1)";
  return (
    <span
      className={cn(
        "relative inline-block overflow-hidden align-bottom",
        className,
      )}
    >
      <span
        className="block transition-transform duration-[460ms] group-hover:-translate-y-full"
        style={{ transitionTimingFunction: ease }}
      >
        {children}
      </span>
      <span
        aria-hidden
        className="absolute left-0 top-0 block translate-y-full transition-transform duration-[460ms] group-hover:translate-y-0"
        style={{ transitionTimingFunction: ease }}
      >
        {children}
      </span>
    </span>
  );
}
