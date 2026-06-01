"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { QuietButton } from "@/components/editorial";
import { photoUrl } from "@/lib/photos";

/**
 * Full-bleed romantic counterpoint between the main grid sections. Photo
 * lifts gently as the user scrolls. Centered, single italic display line,
 * one quiet CTA.
 */
export function RomanticSection() {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const photoY = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden bg-[#08080C] py-40 text-ink md:py-56"
    >
      <motion.div
        aria-hidden
        style={reduced ? undefined : { y: photoY }}
        className="absolute inset-0 -z-10"
      >
        <div className="relative h-[118%] w-full">
          <Image
            src={photoUrl("romantic-bleed", 1800)}
            alt=""
            fill
            sizes="100vw"
            unoptimized
            className="object-cover photo-grade"
          />
        </div>
      </motion.div>
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-[#08080C]/70 via-[#08080C]/55 to-[#08080C]/90"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 shadow-[inset_0_0_200px_rgba(0,0,0,0.7)]"
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-9 px-6 text-center sm:px-8">
        <span className="text-[10px] uppercase tracking-[0.32em] text-accent">
          An add-on, by request
        </span>

        <h2
          className="font-display text-4xl italic leading-[1.05] text-ink sm:text-5xl md:text-6xl"
          style={{ fontWeight: 400 }}
        >
          An evening, designed for two.
        </h2>

        <p className="max-w-xl text-[15px] leading-[1.7] text-ink/75">
          Date nights, anniversaries, and the random Tuesday you want to feel
          something. We hold the space — you bring the people.
        </p>

        <div className="pt-3">
          <QuietButton href="/book/grass" variant="ghost-inverse" size="lg">
            Add the romantic setup
          </QuietButton>
        </div>
      </div>
    </section>
  );
}
