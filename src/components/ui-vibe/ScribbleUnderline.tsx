"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  color?: string;
  thickness?: number;
};

export function ScribbleUnderline({
  className,
  color = "#FF4FA3",
  thickness = 6,
}: Props) {
  const ref = React.useRef<SVGSVGElement | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.querySelectorAll("path").forEach((p) => p.classList.add("drawn"));
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <svg
      ref={ref}
      viewBox="0 0 320 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("block h-4 w-full max-w-[20rem]", className)}
    >
      <path
        className="scribble-path"
        d="M4 14 C 50 4, 100 22, 150 12 S 260 4, 316 14"
        stroke={color}
        strokeWidth={thickness}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
