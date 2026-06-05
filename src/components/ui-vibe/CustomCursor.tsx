"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { useTheme } from "next-themes";

/**
 * Quiet editorial cursor.
 *
 * - Default: 6px filled ink dot.
 * - Over an interactive element (`[data-cursor]`, links, buttons): grows to
 *   a 32px outlined circle (1.5px stroke), the dot stays in the centre.
 * - Over a photo (`[data-cursor="photo"]`): trails a small italic
 *   "view" label.
 * - Hidden on touch devices and when the user has `prefers-reduced-motion`.
 */
export function CustomCursor() {
  const { resolvedTheme } = useTheme();
  // Light cursor on the dark theme, dark cursor on the light theme.
  const dotColor = resolvedTheme === "light" ? "#1A1612" : "#F4F1EA";

  const x = useMotionValue(-40);
  const y = useMotionValue(-40);
  const sx = useSpring(x, { stiffness: 600, damping: 40, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 600, damping: 40, mass: 0.4 });

  const [visible, setVisible] = React.useState(false);
  const [interactive, setInteractive] = React.useState(false);
  const [label, setLabel] = React.useState<string | null>(null);

  React.useEffect(() => {
    const isTouch = window.matchMedia("(hover: none)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isTouch || reduce) return;

    setVisible(true);
    document.documentElement.classList.add("hide-native-cursor");

    function onMove(e: MouseEvent) {
      x.set(e.clientX);
      y.set(e.clientY);
    }

    function findInteractive(el: Element | null): HTMLElement | null {
      let cur: Element | null = el;
      while (cur && cur !== document.body) {
        if (
          cur instanceof HTMLElement &&
          (cur.dataset.cursor ||
            cur.tagName === "A" ||
            cur.tagName === "BUTTON" ||
            cur.getAttribute("role") === "button")
        ) {
          return cur;
        }
        cur = cur.parentElement;
      }
      return null;
    }

    function onOver(e: MouseEvent) {
      const el = findInteractive(e.target as Element | null);
      if (!el) {
        setInteractive(false);
        setLabel(null);
        return;
      }
      setInteractive(true);
      const cursorKind = el.dataset.cursor;
      if (cursorKind === "photo") setLabel("view");
      else if (cursorKind === "heart") setLabel("♡");
      else setLabel(null);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      document.documentElement.classList.remove("hide-native-cursor");
    };
  }, [x, y]);

  if (!visible) return null;

  return (
    <>
      <motion.div
        aria-hidden
        style={{ x: sx, y: sy }}
        className="pointer-events-none fixed left-0 top-0 z-[80] -translate-x-1/2 -translate-y-1/2"
      >
        <motion.div
          animate={{
            width: interactive ? 32 : 6,
            height: interactive ? 32 : 6,
            borderWidth: interactive ? 1.5 : 0,
            backgroundColor: interactive ? "rgba(0,0,0,0)" : dotColor,
          }}
          transition={{ type: "spring", stiffness: 360, damping: 28, mass: 0.4 }}
          className="rounded-full border-ink"
        />
      </motion.div>

      <motion.div
        aria-hidden
        style={{ x: sx, y: sy }}
        className="pointer-events-none fixed left-0 top-0 z-[81] -translate-x-1/2 -translate-y-1/2"
      >
        <motion.div
          animate={{
            opacity: interactive ? 1 : 0,
            scale: interactive ? 1 : 0.5,
          }}
          transition={{ duration: 0.18 }}
          className="h-1.5 w-1.5 rounded-full bg-ink"
        />
      </motion.div>

      {label && (
        <motion.div
          aria-hidden
          style={{ x: sx, y: sy }}
          className="pointer-events-none fixed left-0 top-0 z-[82] -translate-x-1/2 -translate-y-1/2"
        >
          <motion.span
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 24 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="block translate-y-3 font-display text-sm italic text-ink"
            style={{ fontWeight: 400 }}
          >
            {label}
          </motion.span>
        </motion.div>
      )}
    </>
  );
}
