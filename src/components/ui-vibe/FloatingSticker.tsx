"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  rotate?: number;
  delay?: number;
  duration?: number;
  amplitude?: number;
  size?: "sm" | "md" | "lg" | "xl";
};

const SIZE: Record<NonNullable<Props["size"]>, string> = {
  sm: "text-3xl",
  md: "text-5xl",
  lg: "text-6xl",
  xl: "text-7xl sm:text-8xl",
};

export function FloatingSticker({
  children,
  className,
  rotate = 0,
  delay = 0,
  duration = 4,
  amplitude = 12,
  size = "md",
}: Props) {
  return (
    <motion.div
      aria-hidden
      initial={{ y: 0, rotate }}
      animate={{ y: [0, -amplitude, 0, amplitude * 0.5, 0], rotate: [rotate, rotate + 4, rotate, rotate - 3, rotate] }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={cn(
        "pointer-events-none absolute leading-none drop-shadow-[3px_3px_0_rgba(10,10,10,0.18)]",
        SIZE[size],
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
