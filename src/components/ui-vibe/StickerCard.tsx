"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

type Rotation = -7 | -5 | -3 | -2 | 0 | 2 | 3 | 5 | 7;

type Props = Omit<HTMLMotionProps<"div">, "children"> & {
  rotate?: Rotation;
  shadow?: "sm" | "md" | "lg" | "xl";
  bg?: string;
  interactive?: boolean;
  children?: React.ReactNode;
};

const SHADOWS: Record<NonNullable<Props["shadow"]>, string> = {
  sm: "sticker-shadow-hover",
  md: "sticker-shadow",
  lg: "sticker-shadow-lg",
  xl: "sticker-shadow-xl",
};

export function StickerCard({
  rotate = 0,
  shadow = "md",
  bg = "bg-white",
  interactive = true,
  className,
  children,
  style,
  ...rest
}: Props) {
  return (
    <motion.div
      initial={false}
      whileHover={
        interactive
          ? { rotate: 0, y: 2, x: 2, transition: { type: "spring", stiffness: 320, damping: 22 } }
          : undefined
      }
      style={{ rotate, ...style }}
      className={cn(
        "relative rounded-2xl border-3 border-vibe-black",
        bg,
        SHADOWS[shadow],
        interactive && "hover:sticker-shadow-hover transition-shadow",
        className,
      )}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
