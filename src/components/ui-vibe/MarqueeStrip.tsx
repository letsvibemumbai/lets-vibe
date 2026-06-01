"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  useReducedMotion,
} from "motion/react";
import { cn } from "@/lib/utils";

type Props = {
  items: string[];
  rotate?: number;
  /** Base seconds for one loop. Default 30. */
  speed?: number;
  bg?: string;
  textClass?: string;
  className?: string;
  separator?: React.ReactNode;
  /** When true, scroll velocity bumps the marquee speed live. */
  velocityReactive?: boolean;
};

export function MarqueeStrip({
  items,
  rotate = -2,
  speed = 30,
  bg = "bg-vibe-black",
  textClass = "text-vibe-cream",
  className,
  separator,
  velocityReactive = true,
}: Props) {
  const reduced = useReducedMotion();
  const sep = separator ?? (
    <span aria-hidden className="mx-6 inline-block h-2 w-2 rounded-full bg-vibe-pink" />
  );

  // Velocity-reactive: derive a duration multiplier from page scroll velocity.
  // Faster scroll → shorter duration. Damped by spring so it eases back.
  const { scrollY } = useScroll();
  const scrollVel = useVelocity(scrollY);
  const smoothVel = useSpring(scrollVel, { stiffness: 100, damping: 30, mass: 0.5 });
  const boost = useTransform(smoothVel, [-3000, 0, 3000], [0.35, 1, 0.35]);
  const fallback = useMotionValue(1);

  const ref = React.useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = React.useState(0);

  React.useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(() => {
      const el = ref.current?.firstElementChild as HTMLElement | null;
      if (el) setTrackWidth(el.scrollWidth);
    });
    ro.observe(ref.current);
    const el = ref.current.firstElementChild as HTMLElement | null;
    if (el) setTrackWidth(el.scrollWidth);
    return () => ro.disconnect();
  }, [items]);

  // Continuous translation via requestAnimationFrame so velocity boost is live.
  const x = useMotionValue(0);
  React.useEffect(() => {
    if (reduced || trackWidth === 0) return;
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      const mult = velocityReactive ? boost.get() : fallback.get();
      const pxPerSec = trackWidth / speed;
      const delta = pxPerSec * dt * mult;
      let next = x.get() - delta;
      if (next <= -trackWidth) next += trackWidth;
      x.set(next);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [trackWidth, speed, reduced, velocityReactive, boost, fallback, x]);

  const strip = (
    <div className="flex shrink-0 items-center pr-6">
      {items.map((label, i) => (
        <React.Fragment key={`${label}-${i}`}>
          <span className="whitespace-nowrap font-display text-2xl uppercase sm:text-3xl md:text-4xl">
            {label}
          </span>
          {sep}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div
      className={cn(
        "relative w-screen overflow-hidden border-y-3 border-vibe-black",
        bg,
        textClass,
        className,
      )}
      style={{
        transform: `rotate(${rotate}deg)`,
        marginLeft: "-2vw",
        marginRight: "-2vw",
        width: "104vw",
      }}
    >
      <motion.div
        ref={ref}
        style={reduced ? undefined : { x }}
        className="flex items-center py-3 sm:py-4"
      >
        {strip}
        {strip}
        {strip}
      </motion.div>
    </div>
  );
}
