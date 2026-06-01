"use client";

import * as React from "react";
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "motion/react";
import { cn } from "@/lib/utils";

type Variant = "fade-up" | "slide-left" | "slide-right" | "pop" | "fade";

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  /** Entry portion of the scroll progress over which the reveal plays.
   *  Default [0.15, 0.55] means: the reveal animates between 15% and 55%
   *  of the element's transit through the viewport, in BOTH directions. */
  range?: [number, number];
  /** Use parent <ScrollScene> instead of self-tracked scroll progress. */
  fromScene?: boolean;
  className?: string;
  /** Override scroll offset for self-tracked mode. */
  offset?: ["start end" | "start center" | "start start", "end end" | "end start" | "end center"];
};

/**
 * Progress-driven reveal. The animation visually reverses when the user
 * scrolls back up. No useInView, no AnimatePresence — pure scroll-bound
 * MotionValue interpolation.
 */
export function Reveal({
  children,
  variant = "fade-up",
  range = [0.15, 0.55],
  fromScene = false,
  className,
  offset = ["start end", "end start"],
}: Props) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Self-tracked scroll progress. We always call useScroll so hooks stay
  // stable regardless of fromScene; SceneReveal handles the parent case.
  const self = useScroll({ target: ref, offset });
  const progress = self.scrollYProgress;

  return (
    <RevealMotion
      progress={progress}
      variant={variant}
      range={range}
      reduced={!!reduced}
      className={className}
      innerRef={ref}
      fromScene={fromScene}
    >
      {children}
    </RevealMotion>
  );
}

function RevealMotion({
  progress,
  variant,
  range,
  reduced,
  className,
  innerRef,
  children,
  fromScene,
}: {
  progress: MotionValue<number>;
  variant: Variant;
  range: [number, number];
  reduced: boolean;
  className?: string;
  innerRef: React.Ref<HTMLDivElement>;
  fromScene: boolean;
  children: React.ReactNode;
}) {
  const [a, b] = range;

  // Always call the same set of useTransform hooks so the hook order is stable
  // regardless of variant. Pick the right output per variant via style spread.
  const opacity = useTransform(progress, [a, b], [0, 1]);
  const yUp = useTransform(progress, [a, b], [40, 0]);
  const xLeft = useTransform(progress, [a, b], [40, 0]);
  const xRight = useTransform(progress, [a, b], [-40, 0]);
  const scale = useTransform(progress, [a, b], [0.5, 1]);
  const rotate = useTransform(progress, [a, b], [-8, 0]);

  if (reduced) {
    return (
      <div ref={innerRef} className={className}>
        {children}
      </div>
    );
  }

  const style: React.CSSProperties = { opacity: opacity as unknown as number };
  if (variant === "fade-up") {
    Object.assign(style, { y: yUp });
  } else if (variant === "slide-left") {
    Object.assign(style, { x: xLeft });
  } else if (variant === "slide-right") {
    Object.assign(style, { x: xRight });
  } else if (variant === "pop") {
    Object.assign(style, { scale, rotate });
  }

  // When attached to a scene, the ref is unused for scroll tracking but still
  // used as the wrapper — keep it on the outer node.
  void fromScene;

  return (
    <motion.div ref={innerRef} style={style} className={cn(className)}>
      {children}
    </motion.div>
  );
}
