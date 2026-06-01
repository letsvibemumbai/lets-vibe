"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring } from "motion/react";
import { cn } from "@/lib/utils";

type Variant = "pink" | "yellow" | "orange" | "black" | "outline" | "cream";
type Size = "sm" | "md" | "lg" | "xl";

const VARIANT: Record<Variant, string> = {
  pink: "bg-vibe-pink text-white hover:bg-vibe-pink/92",
  yellow: "bg-vibe-yellow text-vibe-black hover:bg-vibe-yellow/92",
  orange: "bg-vibe-orange text-white hover:bg-vibe-orange/92",
  black: "bg-vibe-black text-vibe-cream hover:bg-vibe-black/90",
  outline:
    "bg-transparent text-vibe-black ring-1 ring-vibe-black/30 hover:ring-vibe-black/60 hover:bg-vibe-black/[0.03]",
  cream: "bg-white text-vibe-black ring-1 ring-vibe-black/10 hover:bg-vibe-cream-dark",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-4 text-xs tracking-wide",
  md: "h-10 px-5 text-sm tracking-wide",
  lg: "h-12 px-6 text-sm tracking-[0.04em]",
  xl: "h-14 px-8 text-base tracking-[0.04em]",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  magnetic?: boolean;
  className?: string;
  children: React.ReactNode;
};

type ButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> & {
    href?: undefined;
  };
type LinkProps = CommonProps & { href: string; onClick?: () => void };

export type StickerButtonProps = ButtonProps | LinkProps;

/**
 * Subtle magnetic pull toward the cursor. Refined to be smaller than the
 * old sticker-era version (1.5× less travel) so it reads as "alive" not
 * "playful".
 */
function useMagnetic(enabled: boolean) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 240, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 240, damping: 18, mass: 0.4 });
  const onMove = React.useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!enabled) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const max = 6;
      x.set(Math.max(-max, Math.min(max, dx * 0.18)));
      y.set(Math.max(-max, Math.min(max, dy * 0.18)));
    },
    [enabled, x, y],
  );
  const onLeave = React.useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);
  return { sx, sy, onMove, onLeave };
}

export function StickerButton(props: StickerButtonProps) {
  const variant = props.variant ?? "pink";
  const size = props.size ?? "md";
  const magnetic = props.magnetic ?? true;

  const { sx, sy, onMove, onLeave } = useMagnetic(magnetic);

  const base = cn(
    "relative inline-flex items-center justify-center gap-2 rounded-full font-medium uppercase",
    "transition-[background-color,box-shadow,transform] duration-200 select-none",
    "shadow-[0_1px_2px_rgba(10,10,10,0.06)] hover:shadow-[0_6px_18px_-6px_rgba(10,10,10,0.18)]",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-vibe-pink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-vibe-cream",
    "disabled:opacity-50 disabled:pointer-events-none",
    VARIANT[variant],
    SIZE[size],
    props.className,
  );

  if ("href" in props && props.href !== undefined) {
    return (
      <motion.span
        style={{ x: sx, y: sy }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="inline-block"
      >
        <Link
          href={props.href}
          onClick={props.onClick}
          data-cursor="cta"
          className={base}
        >
          {props.children}
        </Link>
      </motion.span>
    );
  }

  const { type, disabled, onClick, name, value, form, autoFocus } = props as ButtonProps;
  return (
    <motion.button
      type={type ?? "button"}
      disabled={disabled}
      onClick={onClick}
      name={name}
      value={value}
      form={form}
      autoFocus={autoFocus}
      style={{ x: sx, y: sy }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      data-cursor="cta"
      className={base}
    >
      {props.children}
    </motion.button>
  );
}
