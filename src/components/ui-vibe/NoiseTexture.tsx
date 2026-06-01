import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  opacity?: number;
};

/**
 * A fixed, low-opacity SVG noise layer that adds sticker/print texture across
 * the page. Inlined data URL keeps it instant and avoids extra requests.
 */
export function NoiseTexture({ className, opacity = 0.04 }: Props) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/></svg>`;
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none fixed inset-0 z-[1]", className)}
      style={{
        backgroundImage: `url("data:image/svg+xml;utf8,${svg}")`,
        backgroundSize: "160px 160px",
        opacity,
      }}
    />
  );
}
