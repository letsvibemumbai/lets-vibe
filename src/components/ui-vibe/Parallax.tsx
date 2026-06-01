"use client";

import * as React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionStyle,
} from "motion/react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  /** Parallax intensity. 0 = fixed-with-scroll, 1 = scrolls at page speed,
   *  values < 1 lag behind, values > 1 race ahead. Default 0.5 (lags). */
  speed?: number;
  className?: string;
  /** Render as 'div' (default) or 'span' for inline parallax. */
  as?: "div" | "span";
};

/**
 * Scroll-velocity-independent parallax wrapper. Translates the element along
 * Y based on its transit through the viewport. Naturally bidirectional —
 * scroll up, the element retraces its path.
 */
export function Parallax({ children, speed = 0.5, className, as = "div" }: Props) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // 100 = total vertical drift range (px). Adjusted by inverse speed:
  // speed 0.5 → element drifts ~50px slower than scroll.
  const drift = (1 - Math.max(0, Math.min(2, speed))) * 100;
  const y = useTransform(scrollYProgress, [0, 1], [drift, -drift]);
  const style: MotionStyle = reduced ? {} : { y };

  if (as === "span") {
    return (
      <motion.span ref={ref as React.Ref<HTMLDivElement>} style={style} className={cn("inline-block", className)}>
        {children}
      </motion.span>
    );
  }
  return (
    <motion.div ref={ref} style={style} className={cn(className)}>
      {children}
    </motion.div>
  );
}
