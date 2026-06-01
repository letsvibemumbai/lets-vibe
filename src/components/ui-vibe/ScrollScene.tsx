"use client";

import * as React from "react";
import { motion, useScroll, type MotionValue } from "motion/react";

type Offset = Parameters<typeof useScroll>[0] extends infer T
  ? T extends { offset?: infer O }
    ? O
    : never
  : never;

const ScrollSceneContext = React.createContext<MotionValue<number> | null>(null);

type SceneProps = {
  children: React.ReactNode;
  /** Scroll offset for the scene. Default ['start end', 'end start']
   *  (scene progress runs from when its top hits viewport bottom to when its
   *  bottom hits viewport top). */
  offset?: Offset;
  className?: string;
  /** Render as <section> by default; pass "div" to nest. */
  as?: "section" | "div";
};

/**
 * A scroll choreography unit. Children opt in to the scene's progress via
 * useScrollScene() and can each map different sub-ranges of one progress
 * value — letting you sync multiple element animations to the same scroll.
 */
export function ScrollScene({
  children,
  offset = ["start end", "end start"],
  className,
  as = "section",
}: SceneProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset });

  const content = (
    <ScrollSceneContext.Provider value={scrollYProgress}>
      {children}
    </ScrollSceneContext.Provider>
  );

  if (as === "section") {
    return (
      <motion.section ref={ref} className={className}>
        {content}
      </motion.section>
    );
  }
  return (
    <motion.div ref={ref} className={className}>
      {content}
    </motion.div>
  );
}

/** Read the parent scene's scroll progress (0→1 over the scene's transit). */
export function useScrollScene(): MotionValue<number> {
  const ctx = React.useContext(ScrollSceneContext);
  if (!ctx) {
    throw new Error("useScrollScene must be used inside <ScrollScene>");
  }
  return ctx;
}

/** Fallback variant that returns a fixed MotionValue(0) when no scene exists.
 *  Useful for primitives that want to be optionally scene-aware. */
export function useOptionalScrollScene(): MotionValue<number> | null {
  return React.useContext(ScrollSceneContext);
}
