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
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        background:
          "radial-gradient(120% 80% at 50% -10%, rgba(217,169,76,0.10) 0%, rgba(217,169,76,0) 42%), linear-gradient(180deg, #0B0B0F 0%, #0C0C12 50%, #08080C 100%)",
      }}
    />
  );
}
