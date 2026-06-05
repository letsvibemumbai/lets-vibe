"use client";

import * as React from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "motion/react";
import { QuietButton } from "@/components/editorial";
import { photoUrl } from "@/lib/photos";

/**
 * Cinematic hero (V4) — full-bleed photography behind a darkened-auditorium
 * wash, a Playfair display marquee with a gold italic accent, and a box-office
 * meta rail at the foot. Light CTA pill over the dark frame.
 */
export function Hero() {
  const root = React.useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: root,
    offset: ["start start", "end start"],
  });

  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -48]);

  return (
    <section
      ref={root}
      className="dark relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[#08080C] text-ink"
    >
      {/* Photo */}
      <div aria-hidden className="absolute inset-0 -z-20 overflow-hidden">
        <div className={reduced ? "absolute inset-0" : "absolute inset-0 ken-burns"}>
          <Image
            src={photoUrl("hero-warmth", 1800)}
            alt=""
            fill
            priority
            sizes="100vw"
            unoptimized
            className="object-cover"
            style={{ filter: "saturate(0.92) brightness(0.62) contrast(1.08)" }}
          />
        </div>
      </div>

      {/* Cinematic wash: warm spotlight from top, deep fade to black at base */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-[#08080C]/30 via-[#08080C]/45 to-[#08080C]/95"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(90% 60% at 50% 0%, rgba(217,169,76,0.16) 0%, rgba(217,169,76,0) 55%)",
        }}
      />
      {/* Vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 shadow-[inset_0_0_260px_rgba(0,0,0,0.85)]"
      />

      {/* Top whisper */}
      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-5 pt-12 sm:px-8 sm:pt-16 lg:px-12">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: -8 }}
          animate={reduced ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-accent"
        >
          <span className="h-px w-10 bg-accent/50" />
          Mumbai · est. 2024
        </motion.div>
      </div>

      {/* Headline stack — bottom-left, asymmetric */}
      <motion.div
        style={reduced ? undefined : { opacity: contentOpacity, y: contentY }}
        className="relative z-10 mt-auto"
      >
        <div className="mx-auto w-full max-w-[1280px] px-5 pb-28 sm:px-8 sm:pb-32 lg:px-12">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end lg:gap-16">
            <div className="flex flex-col gap-6 lg:col-span-8">
              <span className="text-[11px] uppercase tracking-[0.32em] text-ink/65">
                Private cinema, three vibes
              </span>
              <motion.h1
                initial={reduced ? false : { opacity: 0, y: 18 }}
                animate={reduced ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.2, 0.7, 0.2, 1], delay: 0.05 }}
                className="font-display font-light leading-[0.94] tracking-[-0.02em] text-[clamp(3.25rem,8.5vw,7.5rem)] text-ink"
              >
                Your movie.
                <br />
                Our space.
                <br />
                <span className="italic text-accent">Your vibe.</span>
              </motion.h1>
            </div>

            <div className="flex flex-col gap-7 lg:col-span-4">
              <p className="max-w-md text-[15px] leading-[1.7] text-ink/80">
                Three intimate screens. Your film of choice. The rest, we
                handle — projection, sound, ambience, and a quiet handover.
              </p>

              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <QuietButton href="/book" variant="primary" size="lg">
                  Reserve a screen
                </QuietButton>
                <QuietButton href="/#booking" variant="link" size="md">
                  How it works
                </QuietButton>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom meta rail */}
      <div className="relative z-10 border-t border-hairline">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-10 gap-y-2 px-5 py-4 text-[10px] uppercase tracking-[0.3em] text-ink/55 sm:px-8 lg:px-12">
          <span>Beach · Grass · Forest</span>
          <span className="hidden sm:inline">Open daily, 10:00 — 22:00</span>
          <span className="text-accent/80">4K · Dolby 5.1</span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="pointer-events-none absolute bottom-24 right-6 z-10 hidden flex-col items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-ink/55 sm:right-10 sm:flex">
        <span className="[writing-mode:vertical-rl]">Scroll</span>
        <motion.span
          aria-hidden
          className="block h-12 w-px bg-accent/50"
          animate={reduced ? undefined : { scaleY: [0.3, 1, 0.3] }}
          style={{ transformOrigin: "top" }}
          transition={{ duration: 2.6, ease: "easeInOut", repeat: Infinity }}
        />
      </div>
    </section>
  );
}
