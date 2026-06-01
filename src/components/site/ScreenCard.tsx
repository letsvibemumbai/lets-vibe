"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { photoUrl, type PhotoKey } from "@/lib/photos";

type ScreenTheme = "beach" | "grass" | "forest";

const THEME_PHOTO: Record<ScreenTheme, PhotoKey> = {
  beach: "screen-beach",
  grass: "screen-grass",
  forest: "screen-forest",
};

const THEME_BLURB: Record<ScreenTheme, string> = {
  beach: "Warm sand palette, sundown amber, easy 6–8.",
  grass: "Soft, intimate, built for two. Romantic add-on available.",
  forest: "Tall ceilings, a bathtub, a swing. Best for groups of 8+.",
};

const THEME_CAPACITY: Record<ScreenTheme, string> = {
  beach: "6 – 8 guests",
  grass: "2 – 4 guests",
  forest: "8 – 12 guests",
};

type Props = {
  theme: ScreenTheme;
  name: string;
  description?: string;
  startingPrice: number;
  href?: string;
  rotate?: number;
  romanticBadge?: boolean;
};

/**
 * Refined marketing screen card — editorial, elegant, photography-led.
 * The whole card is a single link target. The visible "Book Beach →"
 * action is a styled span so we don't nest anchors.
 */
export function ScreenCard({
  theme,
  name,
  startingPrice,
  href = "/book",
  romanticBadge,
}: Props) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className="group relative h-full"
    >
      <Link
        href={href}
        aria-label={`Book ${name}`}
        className="relative block h-full overflow-hidden rounded-3xl bg-white shadow-[0_2px_18px_-6px_rgba(10,10,10,0.08)] ring-1 ring-vibe-black/[0.06] transition-shadow hover:shadow-[0_12px_48px_-16px_rgba(10,10,10,0.22)] focus:outline-none focus-visible:ring-2 focus-visible:ring-vibe-black/50"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden">
          <Image
            src={photoUrl(THEME_PHOTO[theme], 1000)}
            alt={`${name} screen`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            unoptimized
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-vibe-black/55 via-vibe-black/10 to-transparent"
          />

          <span className="absolute left-5 top-5 inline-flex items-center rounded-full bg-vibe-cream/90 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.22em] text-vibe-black/75 backdrop-blur">
            {theme}
          </span>

          {romanticBadge && (
            <span className="absolute right-5 top-5 inline-flex items-center rounded-full bg-vibe-pink px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-sm">
              Romantic add-on
            </span>
          )}

          <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-3 text-vibe-cream">
            <div>
              <h3 className="font-display text-3xl leading-none">{name}</h3>
              <p className="mt-2 text-xs uppercase tracking-[0.22em] text-vibe-cream/80">
                {THEME_CAPACITY[theme]}
              </p>
            </div>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-vibe-cream text-vibe-black transition-transform duration-300 group-hover:rotate-12">
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-6 sm:p-7">
          <p className="font-serif text-lg italic leading-snug text-vibe-black/80">
            {THEME_BLURB[theme]}
          </p>

          <div className="flex items-end justify-between gap-3 border-t border-vibe-black/8 pt-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-vibe-black/50">
                Starting at
              </p>
              <p className="mt-1 font-display text-2xl leading-none text-vibe-black">
                ₹{startingPrice.toLocaleString("en-IN")}
                <span className="ml-1 text-xs font-medium text-vibe-black/55">
                  / hr
                </span>
              </p>
            </div>
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-vibe-pink transition-transform group-hover:translate-x-0.5">
              Book {name.split(" ")[0]} →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
