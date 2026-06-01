"use client";

import * as React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "motion/react";
import { ScreenCard } from "@/components/site/ScreenCard";

type Card = {
  theme: "beach" | "grass" | "forest";
  name: string;
  startingPrice: number;
  href: string;
  rotate: number;
  romanticBadge?: boolean;
};

const CARDS: Card[] = [
  { theme: "beach", name: "Beach Vibes", startingPrice: 1500, href: "/book/beach", rotate: -3 },
  { theme: "grass", name: "Grass Garden", startingPrice: 1800, href: "/book/grass", rotate: 2, romanticBadge: true },
  { theme: "forest", name: "Forest Retreat", startingPrice: 2000, href: "/book/forest", rotate: -2 },
];

/**
 * Three screen cards start stacked center, then fan out to their final
 * positions as the user scrolls. Scrubbing back up restacks them.
 * Mobile: skips the choreography and renders a normal grid.
 */
export function ScreensStackAndFan() {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  if (isMobile || reduced) {
    return (
      <div ref={ref} className="grid grid-cols-1 gap-8">
        {CARDS.map((c) => (
          <ScreenCard
            key={c.theme}
            theme={c.theme}
            name={c.name}
            startingPrice={c.startingPrice}
            href={c.href}
            rotate={c.rotate}
            romanticBadge={c.romanticBadge}
          />
        ))}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      {/* Choreographed desktop layout */}
      <div className="grid grid-cols-3 gap-8">
        {CARDS.map((c, i) => (
          <FanSlot key={c.theme} progress={scrollYProgress} index={i} card={c} />
        ))}
      </div>
    </div>
  );
}

function FanSlot({
  progress,
  index,
  card,
}: {
  progress: MotionValue<number>;
  index: number;
  card: Card;
}) {
  // index 0 fans left, 1 stays center, 2 fans right
  // Initial state: stacked (x=0 relative to center) with a tiny rotation
  // Final state: in their natural grid slot (x=0 in their column, rotation = card.rotate)
  const fanX = useTransform(progress, [0.0, 0.7], [
    index === 0 ? "33.5%" : index === 2 ? "-33.5%" : "0%",
    "0%",
  ]);
  const fanY = useTransform(progress, [0.0, 0.7], [60, 0]);
  const fanR = useTransform(progress, [0.0, 0.7], [
    index === 0 ? -6 : index === 2 ? 6 : 0,
    card.rotate,
  ]);
  const fanOpacity = useTransform(progress, [0.0, 0.3], [0.6, 1]);
  const fanScale = useTransform(progress, [0.0, 0.7], [0.92, 1]);

  return (
    <motion.div
      style={{
        x: fanX,
        y: fanY,
        rotate: fanR,
        opacity: fanOpacity,
        scale: fanScale,
        zIndex: index === 1 ? 2 : 1,
      }}
      className="origin-bottom"
    >
      <ScreenCard
        theme={card.theme}
        name={card.name}
        startingPrice={card.startingPrice}
        href={card.href}
        rotate={0}
        romanticBadge={card.romanticBadge}
      />
    </motion.div>
  );
}
