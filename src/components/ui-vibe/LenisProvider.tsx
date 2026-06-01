"use client";

import * as React from "react";

/**
 * Smooth scroll for the public site only (Step 7). Lenis runs in a RAF loop
 * and respects prefers-reduced-motion + touch devices.
 */
export function LenisProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (reduced || touch) return;

    let raf = 0;
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    let cancelled = false;

    (async () => {
      const mod = await import("lenis");
      if (cancelled) return;
      const Lenis = mod.default;
      lenis = new Lenis({
        duration: 1.1,
        smoothWheel: true,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
      const loop = (time: number) => {
        lenis?.raf(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      lenis?.destroy();
    };
  }, []);

  return <>{children}</>;
}
