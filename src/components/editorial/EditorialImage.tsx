"use client";

import * as React from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "motion/react";
import { cn } from "@/lib/utils";

type Aspect = "4/5" | "3/4" | "1/1" | "16/9" | "3/2" | "4/3" | "21/9";

type Props = {
  src: string;
  alt: string;
  caption?: string;
  aspect?: Aspect;
  priority?: boolean;
  sizes?: string;
  /** Apply the editorial warm grade (default true). */
  graded?: boolean;
  /** Scroll-scrubbed scale (default true). Disable inside marquees / galleries. */
  parallax?: boolean;
  className?: string;
  imgClassName?: string;
};

const ASPECT_CLASS: Record<Aspect, string> = {
  "4/5": "aspect-[4/5]",
  "3/4": "aspect-[3/4]",
  "1/1": "aspect-square",
  "16/9": "aspect-video",
  "3/2": "aspect-[3/2]",
  "4/3": "aspect-[4/3]",
  "21/9": "aspect-[21/9]",
};

export function EditorialImage({
  src,
  alt,
  caption,
  aspect = "4/5",
  priority,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  graded = true,
  parallax = true,
  className,
  imgClassName,
}: Props) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1.05, 1]);
  const y = useTransform(scrollYProgress, [0, 1], ["-2%", "2%"]);

  const wantsMotion = parallax && !reduced;

  return (
    <figure className={cn("flex flex-col gap-3", className)}>
      <div
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-sm",
          ASPECT_CLASS[aspect],
          graded && "photo-grade",
        )}
      >
        <motion.div
          style={wantsMotion ? { scale, y } : undefined}
          className="absolute inset-0"
        >
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes={sizes}
            unoptimized
            className={cn("object-cover", imgClassName)}
          />
        </motion.div>
        {/* Inset vignette */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(26,22,18,0.18)]"
        />
      </div>
      {caption && (
        <figcaption className="px-1 text-[11px] uppercase tracking-[0.22em] text-muted">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
