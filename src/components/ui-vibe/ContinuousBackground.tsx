"use client";

/**
 * Cinematic dark wash — fixed behind every public page. A deep near-black
 * base with a faint warm spotlight bleeding from the top, so sections read
 * like a darkened auditorium rather than a flat slab.
 */
export function ContinuousBackground() {
  return (
    <div
      aria-hidden
      className="continuous-bg pointer-events-none fixed inset-0 -z-10"
    />
  );
}
