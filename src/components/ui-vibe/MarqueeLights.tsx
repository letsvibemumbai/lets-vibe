"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

const ITEMS = [
  "Now Showing",
  "Beach Vibes",
  "Grass Garden",
  "Forest Retreat",
  "Private Screenings",
  "Date Nights",
  "By the Hour",
];

/** A row of glowing marquee bulbs that twinkle in a soft staggered wave. */
function Bulbs({ count = 30 }: { count?: number }) {
  return (
    <div className="flex items-center justify-between px-3 sm:px-6" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="lv-bulb h-1.5 w-1.5 rounded-full bg-accent"
          style={{ animationDelay: `${(i % 6) * 0.2}s` }}
        />
      ))}
    </div>
  );
}

const Star = () => (
  <span aria-hidden className="mx-5 text-base text-accent sm:mx-7 sm:text-lg">
    &#10022;
  </span>
);

/**
 * "Now Showing" cinema-marquee band — a strip of glowing gold bulbs framing a
 * slow, looping line of Playfair display text. A theatrical divider that pays
 * off the Beach / Grass / Forest names. Dark-scoped; reduced-motion safe.
 */
export function MarqueeLights() {
  const reduced = useReducedMotion();

  const strip = (
    <div className="flex shrink-0 items-center">
      {ITEMS.map((label, i) => (
        <React.Fragment key={`${label}-${i}`}>
          <span
            className="whitespace-nowrap font-display text-xl uppercase tracking-[0.1em] text-ink/90 sm:text-2xl md:text-3xl"
            style={{ fontWeight: 300 }}
          >
            {label}
          </span>
          <Star />
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <section className="dark relative isolate overflow-hidden border-y border-hairline bg-[#0c0b10] py-5 text-ink sm:py-6">
      {/* warm centre glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 50%, rgba(217,169,76,0.10) 0%, rgba(217,169,76,0) 60%)",
        }}
      />

      <Bulbs />

      <div className="relative my-3 overflow-hidden sm:my-4">
        {/* edge fades so text dissolves into the band */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0c0b10] to-transparent sm:w-28"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0c0b10] to-transparent sm:w-28"
        />
        <motion.div
          className="flex w-max items-center"
          animate={reduced ? undefined : { x: ["0%", "-50%"] }}
          transition={{ duration: 28, ease: "linear", repeat: Infinity }}
        >
          {/* two identical halves → seamless -50% loop */}
          {strip}
          <Star />
          {strip}
          <Star />
        </motion.div>
      </div>

      <Bulbs />
    </section>
  );
}
