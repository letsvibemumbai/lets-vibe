"use client";

import { Check } from "lucide-react";
import { motion } from "motion/react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { cn } from "@/lib/utils";

type Props = {
  duration: string;
  /** Numeric starting price (₹) for animated ticker */
  startingPrice: number;
  description: string;
  features: readonly string[];
  highlighted?: boolean;
  rotate?: number;
};

export function PackageCard({
  duration,
  startingPrice,
  description,
  features,
  highlighted,
}: Props) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className={cn(
        "relative flex h-full flex-col rounded-3xl p-8 transition-shadow",
        highlighted
          ? "bg-vibe-black text-vibe-cream shadow-[0_18px_60px_-22px_rgba(10,10,10,0.55)]"
          : "bg-white shadow-[0_2px_18px_-6px_rgba(10,10,10,0.08)] ring-1 ring-vibe-black/[0.06] hover:shadow-[0_10px_40px_-14px_rgba(10,10,10,0.18)]",
      )}
    >
      {highlighted && (
        <span className="absolute right-6 top-6 inline-flex items-center rounded-full bg-vibe-pink px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
          Most picked
        </span>
      )}

      <p
        className={cn(
          "text-[11px] uppercase tracking-[0.22em]",
          highlighted ? "text-vibe-cream/55" : "text-vibe-black/50",
        )}
      >
        {duration}
      </p>

      <div
        className={cn(
          "mt-5 flex items-baseline gap-1",
          highlighted ? "text-vibe-cream" : "text-vibe-black",
        )}
      >
        <span className="font-display text-3xl">₹</span>
        <NumberTicker
          value={startingPrice}
          className={cn(
            "font-display text-5xl leading-none",
            highlighted ? "text-vibe-cream" : "text-vibe-black",
          )}
        />
        <span
          className={cn(
            "ml-1 text-xs font-medium",
            highlighted ? "text-vibe-cream/55" : "text-vibe-black/50",
          )}
        >
          onwards
        </span>
      </div>

      <p
        className={cn(
          "mt-4 font-serif text-lg italic leading-snug",
          highlighted ? "text-vibe-cream/85" : "text-vibe-black/75",
        )}
      >
        {description}
      </p>

      <ul
        className={cn(
          "mt-8 space-y-3 border-t pt-6 text-sm",
          highlighted ? "border-vibe-cream/15 text-vibe-cream/80" : "border-vibe-black/8 text-vibe-black/75",
        )}
      >
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                highlighted ? "text-vibe-pink" : "text-vibe-pink",
              )}
              strokeWidth={2.25}
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
