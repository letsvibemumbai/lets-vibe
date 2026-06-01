"use client";

import * as React from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  rotate?: number;
  /** Range over which the note is visible. The note fades in around the
   *  midpoint of its scroll-through then fades out as it leaves. */
  range?: [number, number];
};

/**
 * A handwritten "psst — book the romantic setup, trust us" note that floats
 * in the margin during the romantic stretch. Fades in/out with scroll so it
 * naturally reverses on the way back up.
 */
export function LoveNote({
  children,
  className,
  rotate = -8,
  range = [0.25, 0.75],
}: Props) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const [start, end] = range;
  const opacity = useTransform(scrollYProgress, [start - 0.05, start, end, end + 0.05], [0, 1, 1, 0]);
  const r = useTransform(scrollYProgress, [start, end], [rotate - 6, rotate + 4]);
  const y = useTransform(scrollYProgress, [start, end], [10, -10]);

  if (reduced) {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-block rounded-2xl border-3 border-vibe-black bg-vibe-cream px-4 py-2 font-hand text-xl text-vibe-black sticker-shadow",
          className,
        )}
        style={{ transform: `rotate(${rotate}deg)` }}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      style={{ opacity, rotate: r, y }}
      className={cn(
        "inline-block rounded-2xl border-3 border-vibe-black bg-vibe-cream px-4 py-2 font-hand text-xl text-vibe-black sticker-shadow",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
