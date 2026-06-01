import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { photoUrl, type PhotoKey } from "@/lib/photos";

type ScreenTheme = "beach" | "grass" | "forest";

const THEME_PHOTO: Record<ScreenTheme, PhotoKey> = {
  beach: "screen-beach",
  grass: "screen-grass",
  forest: "screen-forest",
};

const THEME_BLURB: Record<ScreenTheme, string> = {
  beach: "Warm sand palette. Sundown amber. Easy for six to eight.",
  grass: "Soft and intimate. Built for two. Romantic setup, by request.",
  forest: "Tall ceilings, a bathtub, a swing. Best for groups of eight.",
};

const THEME_CAPACITY: Record<ScreenTheme, string> = {
  beach: "6 – 8 guests",
  grass: "2 – 4 guests",
  forest: "8 – 12 guests",
};

type Props = {
  theme: ScreenTheme;
  name: string;
  startingPrice: number;
  href: string;
  romanticBadge?: boolean;
};

/**
 * Editorial card for the booking-flow screen picker. Hairline border, no
 * shadow, no rotation. Photo carries the warmth.
 */
export function BookScreenCard({
  theme,
  name,
  startingPrice,
  href,
  romanticBadge,
}: Props) {
  return (
    <Link
      href={href}
      aria-label={`Reserve ${name}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-sm bg-cream ring-1 ring-hairline transition-all hover:ring-hairline-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <Image
          src={photoUrl(THEME_PHOTO[theme], 1000)}
          alt={`${name} screen`}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04] photo-grade"
          unoptimized
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/10 to-transparent"
        />

        <span className="absolute left-4 top-4 inline-flex items-center rounded-sm bg-cream/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.22em] text-ink/75 backdrop-blur">
          {theme}
        </span>

        {romanticBadge && (
          <span className="absolute right-4 top-4 inline-flex items-center rounded-sm bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-cream">
            Romantic add-on
          </span>
        )}

        <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 text-cream">
          <div>
            <h3
              className="font-display text-2xl leading-none tracking-[-0.01em] sm:text-3xl"
              style={{ fontWeight: 400 }}
            >
              {name}
            </h3>
            <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-cream/80">
              {THEME_CAPACITY[theme]}
            </p>
          </div>
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream text-ink transition-transform duration-300 group-hover:rotate-12">
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-5 p-5 sm:p-6">
        <p className="text-[14px] leading-[1.65] text-muted">
          {THEME_BLURB[theme]}
        </p>

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-hairline pt-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted">
              From
            </p>
            <p
              className="mt-1 font-display text-xl leading-none text-ink"
              style={{ fontWeight: 400 }}
            >
              ₹{startingPrice.toLocaleString("en-IN")}
              <span className="ml-1 text-xs font-medium text-muted">
                / hour
              </span>
            </p>
          </div>
          <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent transition-transform group-hover:translate-x-0.5">
            Select →
          </span>
        </div>
      </div>
    </Link>
  );
}
