import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Brand logo — the official "Let's Vibe" mark (public/logo.png, a transparent
 * PNG generated from the brand PDF). Sits on any background. Height is driven
 * by `imgClassName` (e.g. "h-9 w-auto"); the default suits the navbar.
 */
type Props = {
  alt?: string;
  href?: string | null;
  className?: string;
  /** Tailwind sizing utility for the image (default: navbar height). */
  imgClassName?: string;
};

export function Logo({
  alt = "Let's Vibe",
  href = "/",
  className,
  imgClassName,
}: Props) {
  const inner = (
    // The source PNG is 1600×541 (~350 KB) but the logo only ever renders at
    // ~120–150 px wide. Letting Next optimize it (transparency is preserved by
    // the WebP/AVIF output) ships a right-sized image a few KB in size instead
    // of the full raw PNG on every page — a real first-paint win site-wide.
    // `sizes` caps the generated width at the actual display size.
    <Image
      src="/logo.png"
      alt={alt}
      width={1600}
      height={541}
      priority
      sizes="160px"
      className={cn("h-10 w-auto", imgClassName)}
    />
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
