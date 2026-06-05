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
    <Image
      src="/logo.png"
      alt={alt}
      width={1600}
      height={541}
      priority
      unoptimized
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
