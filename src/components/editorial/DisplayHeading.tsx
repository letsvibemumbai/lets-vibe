"use client";

import * as React from "react";
import { motion, useInView } from "motion/react";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";
type AsTag = "h1" | "h2" | "h3";

type Props = {
  as?: AsTag;
  size?: Size;
  className?: string;
  /** When true, foreground sits on a dark background — flips colours. */
  invert?: boolean;
  children: React.ReactNode;
};

const SIZE_CLASS: Record<Size, string> = {
  sm: "text-3xl sm:text-4xl md:text-5xl",
  md: "text-4xl sm:text-5xl md:text-6xl",
  lg: "text-5xl sm:text-6xl md:text-7xl",
  xl: "text-[clamp(3.5rem,9vw,8rem)]",
};

/**
 * Editorial display heading — Fraunces serif, light weight, tight tracking,
 * line-height 0.95–1.05 depending on size. Pair with italic spans for
 * emphasis.
 *
 * On enter, the heading fades up with a subtle mask wipe — quiet, not
 * theatrical.
 */
export function DisplayHeading({
  as: Tag = "h2",
  size = "md",
  className,
  invert,
  children,
}: Props) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });

  return (
    <div ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 14, clipPath: "inset(0 100% 0 0)" }}
        animate={
          inView
            ? { opacity: 1, y: 0, clipPath: "inset(0 0% 0 0)" }
            : undefined
        }
        transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
      >
        {React.createElement(
          Tag,
          {
            className: cn(
              "font-display leading-[0.98] tracking-[-0.02em]",
              SIZE_CLASS[size],
              size === "xl" && "tracking-[-0.04em] leading-[0.95]",
              invert ? "text-cream" : "text-ink",
              className,
            ),
            style: { fontWeight: 300 },
          },
          children,
        )}
      </motion.div>
    </div>
  );
}
