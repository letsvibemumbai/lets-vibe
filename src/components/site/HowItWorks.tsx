"use client";

import { Reveal } from "@/components/ui-vibe";

const STEPS = [
  {
    title: "Pick a screen",
    body: "Beach, Grass, or Forest — each with its own mood and capacity.",
  },
  {
    title: "Pick a time",
    body: "1, 2, or 3 hours. We're open daily from morning through late evening.",
  },
  {
    title: "Pick a movie",
    body: "Bring your own pick, or choose from our curated catalogue.",
  },
  {
    title: "Press play",
    body: "Show up, settle in. We take care of everything else.",
  },
] as const;

export function HowItWorks() {
  return (
    <ol className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl bg-vibe-black/8 ring-1 ring-vibe-black/[0.06] sm:grid-cols-2 lg:grid-cols-4">
      {STEPS.map((step, i) => (
        <Reveal
          key={step.title}
          variant="fade-up"
          range={[0.1 + i * 0.04, 0.45 + i * 0.04]}
        >
          <li className="flex h-full flex-col gap-4 bg-white p-7 sm:p-8">
            <p className="font-display text-2xl leading-none text-vibe-pink">
              {String(i + 1).padStart(2, "0")}
            </p>
            <h3 className="font-display text-xl leading-tight text-vibe-black">
              {step.title}
            </h3>
            <p className="text-sm leading-relaxed text-vibe-black/65">
              {step.body}
            </p>
          </li>
        </Reveal>
      ))}
    </ol>
  );
}
