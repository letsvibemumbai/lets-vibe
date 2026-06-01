import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  attribution?: string;
  className?: string;
  invert?: boolean;
  children: React.ReactNode;
};

/**
 * Large serif italic pull-quote with a thin pink left border. Used as a
 * visual rest between sections — testimonial blocks, editorial asides.
 */
export function PullQuote({
  attribution,
  className,
  invert,
  children,
}: Props) {
  return (
    <figure
      className={cn(
        "border-l-2 border-accent/70 pl-6 sm:pl-8",
        className,
      )}
    >
      <blockquote
        className={cn(
          "font-display italic text-2xl leading-[1.35] tracking-[-0.01em] sm:text-3xl md:text-[2rem]",
          invert ? "text-cream" : "text-ink",
        )}
        style={{ fontWeight: 300 }}
      >
        {children}
      </blockquote>
      {attribution && (
        <figcaption
          className={cn(
            "mt-6 text-[11px] uppercase tracking-[0.22em]",
            invert ? "text-cream/55" : "text-muted",
          )}
        >
          — {attribution}
        </figcaption>
      )}
    </figure>
  );
}
