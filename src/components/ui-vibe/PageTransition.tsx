"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25, ease: [0.65, 0, 0.35, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Pink curtain sweep on route change */}
      <AnimatePresence>
        <motion.div
          key={`curtain-${pathname}`}
          aria-hidden
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          exit={{ scaleX: 0 }}
          transition={{ duration: 0.45, ease: [0.65, 0, 0.35, 1] }}
          style={{ transformOrigin: "right" }}
          className="pointer-events-none fixed inset-0 z-[9998] bg-vibe-pink"
        />
      </AnimatePresence>
    </>
  );
}
