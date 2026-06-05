"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

/**
 * Soft, smooth inertial scrolling (Lenis) for the customer-facing site.
 *
 * Driven by GSAP's ticker and wired to ScrollTrigger.update so the pinned /
 * scrubbed scroll animations stay perfectly in sync. Disabled on the admin
 * panel (data work wants native scroll), on touch devices, and when the user
 * prefers reduced motion. Renders nothing.
 */
export function SmoothScroll() {
  const pathname = usePathname() ?? "";
  const enabled = !pathname.startsWith("/admin");

  React.useEffect(() => {
    if (!enabled) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (reduced || touch) return;

    let cancelled = false;
    let lenis: Lenis | null = null;
    let onScroll: (() => void) | null = null;
    let tick: ((time: number) => void) | null = null;

    (async () => {
      const mod = await import("lenis");
      if (cancelled) return;
      const LenisCtor = mod.default;
      lenis = new LenisCtor({
        duration: 1.15,
        smoothWheel: true,
        // ease-out expo — gentle, soft settle.
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });

      onScroll = () => ScrollTrigger.update();
      lenis.on("scroll", onScroll);

      tick = (time: number) => lenis?.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      ScrollTrigger.refresh();
    })();

    return () => {
      cancelled = true;
      if (tick) gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33); // restore GSAP default
      if (lenis && onScroll) lenis.off("scroll", onScroll);
      lenis?.destroy();
    };
  }, [enabled]);

  return null;
}
