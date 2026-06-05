"use client";

import * as React from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "motion/react";
import { Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

type Size = "md" | "lg";

type CommonProps = {
  size?: Size;
  className?: string;
  /** Content shown in the perforated stub. Defaults to a ticket glyph. */
  stub?: React.ReactNode;
  children: React.ReactNode;
};
type ButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> & {
    href?: undefined;
  };
type LinkProps = CommonProps & {
  href: string;
  onClick?: () => void;
  target?: string;
  rel?: string;
};
export type TicketButtonProps = ButtonProps | LinkProps;

const SIZE: Record<
  Size,
  { body: string; text: string; stub: string; icon: string }
> = {
  md: { body: "h-12", text: "text-[11px]", stub: "px-3.5", icon: "h-4 w-4" },
  lg: { body: "h-14", text: "text-xs", stub: "px-4", icon: "h-[18px] w-[18px]" },
};

/**
 * The torn ends of the ticket — true alpha cutouts via two intersecting
 * radial masks, so the notches show whatever is behind the button (works on
 * any background, light or dark). `mask-repeat: no-repeat` is essential or the
 * gradients tile.
 */
const TICKET_MASK: React.CSSProperties = {
  WebkitMaskImage:
    "radial-gradient(circle at left, transparent 7px, #000 7.5px), radial-gradient(circle at right, transparent 7px, #000 7.5px)",
  maskImage:
    "radial-gradient(circle at left, transparent 7px, #000 7.5px), radial-gradient(circle at right, transparent 7px, #000 7.5px)",
  WebkitMaskRepeat: "no-repeat, no-repeat",
  maskRepeat: "no-repeat, no-repeat",
  WebkitMaskComposite: "source-in",
  maskComposite: "intersect",
};

/** Gentle magnetic pull toward the cursor (≤6px, springy). */
function useMagnetic(enabled: boolean) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 240, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 240, damping: 18, mass: 0.4 });
  const onMove = React.useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!enabled) return;
      const r = e.currentTarget.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const max = 6;
      x.set(Math.max(-max, Math.min(max, dx * 0.16)));
      y.set(Math.max(-max, Math.min(max, dy * 0.16)));
    },
    [enabled, x, y],
  );
  const onLeave = React.useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);
  return { sx, sy, onMove, onLeave };
}

/**
 * TicketButton — a cinema ticket-stub styled call-to-action. Notched "torn"
 * ends, a dashed gold perforation, a stub holding a ticket glyph, a gold sheen
 * that sweeps across on hover (a marquee light passing), and a soft magnetic
 * pull. The signature CTA for Let's Vibe.
 */
export function TicketButton(props: TicketButtonProps) {
  const size = props.size ?? "lg";
  const reduced = useReducedMotion();
  const { sx, sy, onMove, onLeave } = useMagnetic(!reduced);
  const s = SIZE[size];
  const stub = props.stub ?? <Ticket className={s.icon} strokeWidth={1.75} />;

  const inner = (
    <>
      {/* gold light sheen, sweeps left→right on hover (a marquee light passing) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 -translate-x-[160%] skew-x-[-20deg] bg-gradient-to-r from-transparent via-accent/40 to-transparent transition-transform duration-700 ease-out group-hover/tk:translate-x-[160%]"
      />
      {/* body — the label */}
      <span
        className={cn(
          "relative z-10 flex items-center gap-2 pl-5 pr-4 font-semibold uppercase tracking-[0.18em]",
          s.text,
        )}
      >
        {props.children}
      </span>
      {/* dashed perforation */}
      <span
        aria-hidden
        className="relative z-10 my-2 self-stretch border-l border-dashed border-accent/60"
      />
      {/* stub */}
      <span
        className={cn("relative z-10 flex items-center text-accent", s.stub)}
      >
        {stub}
      </span>
    </>
  );

  const rootClass = cn(
    "group/tk relative isolate inline-flex select-none items-stretch overflow-hidden rounded-[14px] bg-ink text-cream",
    "ring-1 ring-inset ring-white/10",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
    s.body,
    props.className,
  );

  if ("href" in props && props.href !== undefined) {
    return (
      <motion.span
        style={{ x: sx, y: sy, filter: "drop-shadow(0 10px 22px rgba(0,0,0,0.28))" }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="inline-block"
      >
        <Link
          href={props.href}
          onClick={props.onClick}
          target={props.target}
          rel={props.rel}
          data-cursor="cta"
          className={rootClass}
          style={TICKET_MASK}
        >
          {inner}
        </Link>
      </motion.span>
    );
  }

  const { type, disabled, onClick, name, value, form, autoFocus } =
    props as ButtonProps;
  return (
    <motion.span
      style={{ x: sx, y: sy, filter: "drop-shadow(0 10px 22px rgba(0,0,0,0.28))" }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="inline-block"
    >
      <button
        type={type ?? "button"}
        disabled={disabled}
        onClick={onClick}
        name={name}
        value={value}
        form={form}
        autoFocus={autoFocus}
        data-cursor="cta"
        className={cn(
          rootClass,
          "disabled:opacity-50 disabled:pointer-events-none",
        )}
        style={TICKET_MASK}
      >
        {inner}
      </button>
    </motion.span>
  );
}
