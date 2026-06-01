"use client";

import * as React from "react";
import { Marquee } from "@/components/ui/marquee";

type Review = { text: string; handle: string };

const TOP: Review[] = [
  { text: "Literally the cutest date night we've ever had.", handle: "@aanyaa" },
  { text: "We cried during Inception. 10/10 would cry again.", handle: "@vkrm.s" },
  { text: "Took my parents. They keep asking when we're going back.", handle: "@meera.k" },
  { text: "Booked the romantic setup and now I'm engaged. Coincidence?", handle: "@kabir.d" },
  { text: "Best ₹2000 I've ever spent on a Tuesday.", handle: "@priya.m" },
];

const BOTTOM: Review[] = [
  { text: "Forest screen + Barbenheimer marathon = unreal.", handle: "@dev.x" },
  { text: "Sound system goes hard. The popcorn-fight scene? Felt it.", handle: "@ridham" },
  { text: "They let us bring decorations for the surprise. He sobbed.", handle: "@ishaa" },
  { text: "Grass screen on a Sunday afternoon is my new religion.", handle: "@noor.r" },
  { text: "Booked in literally 90 seconds. Money.", handle: "@arsh" },
];

function Note({ review }: { review: Review }) {
  return (
    <figure className="mx-3 w-[22rem] shrink-0 rounded-2xl bg-vibe-cream/[0.04] p-7 ring-1 ring-vibe-cream/15 backdrop-blur-sm">
      <span aria-hidden className="block font-serif text-4xl leading-none text-vibe-pink/70">
        &ldquo;
      </span>
      <blockquote className="mt-3 font-serif text-xl italic leading-snug text-vibe-cream">
        {review.text}
      </blockquote>
      <figcaption className="mt-5 text-[11px] uppercase tracking-[0.22em] text-vibe-cream/55">
        {review.handle}
      </figcaption>
    </figure>
  );
}

export function ReviewsMarquee() {
  return (
    <div className="space-y-4">
      <Marquee className="[--duration:75s] [--gap:0.25rem] py-3" pauseOnHover>
        {TOP.map((r) => <Note key={r.handle} review={r} />)}
      </Marquee>
      <Marquee className="[--duration:65s] [--gap:0.25rem] py-3" pauseOnHover reverse>
        {BOTTOM.map((r) => <Note key={r.handle} review={r} />)}
      </Marquee>
    </div>
  );
}
