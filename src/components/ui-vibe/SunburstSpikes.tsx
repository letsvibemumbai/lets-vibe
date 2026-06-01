import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  spikes?: number;
  primary?: string;
  secondary?: string;
  rotate?: number;
};

export function SunburstSpikes({
  className,
  spikes = 24,
  primary = "#FF7A00",
  secondary = "#FFD93D",
  rotate = 0,
}: Props) {
  const step = 360 / spikes;
  return (
    <svg
      viewBox="-100 -100 200 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("pointer-events-none", className)}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <g>
        {Array.from({ length: spikes }).map((_, i) => (
          <polygon
            key={i}
            points="0,-92 9,-50 -9,-50"
            fill={i % 2 === 0 ? primary : secondary}
            transform={`rotate(${i * step})`}
          />
        ))}
      </g>
      <circle r="44" fill={secondary} stroke="#0A0A0A" strokeWidth="3" />
    </svg>
  );
}
