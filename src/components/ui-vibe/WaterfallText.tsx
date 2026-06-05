"use client";

import * as React from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Props = {
  text: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Waterfall reveal — splits `text` into words that drop in from above one
 * after another (staggered cascade) as the heading scrolls into view (GSAP
 * ScrollTrigger, plays once). Reduced-motion safe.
 */
export function WaterfallText({ text, as: Tag = "h2", className, style }: Props) {
  const ref = React.useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      const items = gsap.utils.toArray<HTMLElement>("[data-fall]", ref.current);
      if (!items.length) return;
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduce) {
        gsap.set(items, { y: 0, opacity: 1 });
        return;
      }
      gsap.set(items, { y: -36, opacity: 0 });
      gsap.to(items, {
        y: 0,
        opacity: 1,
        ease: "power3.out",
        duration: 0.75,
        stagger: 0.08,
        scrollTrigger: { trigger: ref.current, start: "top 82%", once: true },
      });
    },
    { scope: ref },
  );

  const words = text.split(" ");
  return React.createElement(
    Tag,
    { ref, className, style, "aria-label": text },
    words.map((w, i) => (
      <span
        key={`${w}-${i}`}
        data-fall
        aria-hidden
        className="inline-block"
        style={{ marginRight: "0.24em" }}
      >
        {w}
      </span>
    )),
  );
}
