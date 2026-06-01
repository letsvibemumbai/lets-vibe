"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui-vibe";
import { photoUrl } from "@/lib/photos";

export function RomanticAddon() {
  return (
    <div className="relative">
      <Reveal variant="fade-up" range={[0.1, 0.45]}>
        <div className="relative mx-auto grid max-w-5xl grid-cols-1 items-stretch overflow-hidden rounded-3xl bg-white shadow-[0_2px_24px_-6px_rgba(10,10,10,0.08)] ring-1 ring-vibe-black/[0.06] md:grid-cols-[1fr_1.1fr]">
          <div className="relative aspect-[4/3] w-full overflow-hidden md:aspect-auto">
            <Image
              src={photoUrl("romantic-addon", 1000)}
              alt="Romantic setup at the Grass Garden screen"
              fill
              sizes="(min-width: 768px) 45vw, 100vw"
              className="object-cover"
              unoptimized
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-r from-vibe-black/15 via-transparent to-transparent md:bg-gradient-to-l"
            />
          </div>

          <div className="flex flex-col justify-center gap-5 p-8 sm:p-12">
            <p className="text-[10px] uppercase tracking-[0.28em] text-vibe-pink">
              Add-on · Grass screen
            </p>
            <h3 className="font-serif text-3xl italic leading-tight text-vibe-black sm:text-4xl">
              Rose petals, fairy lights, the works.
            </h3>
            <p className="text-base leading-relaxed text-vibe-black/70">
              The romantic setup turns the Grass Garden into a quiet, soft-lit
              hideaway. Optional — but worth it. +₹800.
            </p>
            <Link
              href="/book/grass"
              className="group mt-2 inline-flex w-fit items-center gap-1.5 text-sm font-medium uppercase tracking-[0.18em] text-vibe-black transition-colors hover:text-vibe-pink"
            >
              Add the setup
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
