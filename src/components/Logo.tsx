import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Brand wordmark. Cinematic V4 — a refined Playfair Display lockup, "Let's"
 * in warm ink with "Vibe" in gold italic. Pure type, no raster sticker, so it
 * sits cleanly on the dark cinema palette and scales crisply everywhere.
 */
type Props = {
  alt?: string;
  href?: string | null;
  className?: string;
  /** Tailwind text-size utility for the wordmark (defaults to a navbar size). */
  imgClassName?: string;
};

export function Logo({
  alt = "Let's Vibe",
  href = "/",
  className,
  imgClassName,
}: Props) {
  const inner = (
    <span
      aria-label={alt}
      className={cn(
        "font-display text-[1.4rem] font-medium leading-none tracking-[-0.01em] text-ink",
        imgClassName,
      )}
    >
      Let&rsquo;s <span className="italic text-accent">Vibe</span>
    </span>
  );

  if (href === null) {
    return (
      <span className={cn("inline-flex items-center", className)}>{inner}</span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={alt}
      className={cn(
        "inline-flex items-center transition-opacity hover:opacity-80",
        className,
      )}
      data-cursor="cta"
    >
      {inner}
    </Link>
  );
}
