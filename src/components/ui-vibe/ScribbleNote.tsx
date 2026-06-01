"use client";

import * as React from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  rotate?: number;
  /** Scroll range over which the note fades in/out. Default [0.1, 0.4]. */
  range?: [number, number];
};

/**
 * A handwritten margin scribble that fades and bounces in as the user scrolls
 * past it, then fades back out when they scroll above it. Bidirectional.
 *
 * Renders as a <motion.span> with display: inline-block so it's safe to nest
 * inside <p>, <h2>, <span> contexts without HTML validity errors.
 */
export function ScribbleNote({
  children,
  className,
  rotate = -4,
  range = [0.1, 0.4],
}: Props) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const opacity = useTransform(
    scrollYProgress,
    [range[0], range[1], 1 - range[1], 1 - range[0]],
    [0, 1, 1, 0],
  );
  const y = useTransform(scrollYProgress, [range[0], range[1]], [12, 0]);
  const r = useTransform(scrollYProgress, [range[0], range[1]], [rotate - 6, rotate]);

  if (reduced) {
    return (
      <span
        ref={ref}
        className={cn("inline-block font-hand text-vibe-pink", className)}
        style={{ transform: `rotate(${rotate}deg)` }}
      >
        {children}
      </span>
    );
  }

  return (
    <motion.span
      ref={ref}
      style={{ opacity, y, rotate: r, display: "inline-block" }}
      className={cn("font-hand text-2xl leading-none text-vibe-pink", className)}
    >
      {children}
    </motion.span>
  );
}
