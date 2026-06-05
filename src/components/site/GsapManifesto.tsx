"use client";

import * as React from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SectionLabel } from "@/components/editorial";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const LINE = "A private cinema built for two — your film, your night, your vibe.";
// Words that get the gold accent as they reveal.
const ACCENT = new Set(["two", "vibe."]);

/**
 * Sleek pinned "sticky scroll" manifesto. The section pins while the headline
 * reveals word-by-word, scrubbed to scroll position (GSAP ScrollTrigger).
 * Theme-aware (tokens) and reduced-motion safe.
 */
export function GsapManifesto() {
  const root = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const words = gsap.utils.toArray<HTMLElement>("[data-word]", root.current);
      if (!words.length) return;

      if (reduce) {
        gsap.set(words, { opacity: 1, y: 0 });
        return;
      }

      gsap.set(words, { opacity: 0.12, y: 8 });
      gsap.to(words, {
        opacity: 1,
        y: 0,
        ease: "none",
        stagger: 0.4,
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=160%",
          scrub: 0.6,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
        },
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative flex min-h-[100svh] items-center overflow-hidden"
    >
      {/* faint gold spotlight, theme-aware via opacity on the gold accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 50%, rgba(217,169,76,0.07) 0%, rgba(217,169,76,0) 70%)",
        }}
      />
      <div className="relative mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-12">
        <SectionLabel tone="accent" className="mb-8">
          The vibe
        </SectionLabel>
        <h2
          className="font-display leading-[1.06] tracking-[-0.02em] text-ink text-[clamp(2rem,5.2vw,4.75rem)]"
          style={{ fontWeight: 400 }}
          aria-label={LINE}
        >
          {LINE.split(" ").map((word, i) => (
            <span
              key={`${word}-${i}`}
              data-word
              aria-hidden
              className={
                "mr-[0.22em] inline-block " +
                (ACCENT.has(word) ? "italic text-accent" : "")
              }
            >
              {word}
            </span>
          ))}
        </h2>
      </div>
    </section>
  );
}
