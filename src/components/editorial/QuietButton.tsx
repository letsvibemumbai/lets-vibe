"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "link" | "ghost-inverse";
type Size = "sm" | "md" | "lg";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  /** Show a right-arrow that slides 4px on hover. Defaults true. */
  arrow?: boolean;
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

export type QuietButtonProps = ButtonProps | LinkProps;

const SIZE_CLASS: Record<Variant, Record<Size, string>> = {
  primary: {
    sm: "h-9 px-4 text-[11px]",
    md: "h-11 px-5 text-xs",
    lg: "h-12 px-6 text-xs",
  },
  secondary: {
    sm: "h-9 px-4 text-[11px]",
    md: "h-11 px-5 text-xs",
    lg: "h-12 px-6 text-xs",
  },
  link: {
    sm: "text-[11px]",
    md: "text-xs",
    lg: "text-sm",
  },
  "ghost-inverse": {
    sm: "h-9 px-4 text-[11px]",
    md: "h-11 px-5 text-xs",
    lg: "h-12 px-6 text-xs",
  },
};

function variantClasses(variant: Variant): string {
  switch (variant) {
    case "primary":
      return cn(
        "inline-flex items-center justify-center gap-2 rounded-full",
        "bg-ink text-cream font-semibold uppercase tracking-[0.18em]",
        "transition-[transform,background-color,opacity] duration-200",
        "hover:scale-[1.015] active:scale-[0.99]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
      );
    case "secondary":
      return cn(
        "group/qb inline-flex items-center justify-center gap-2 rounded-full",
        "bg-transparent text-ink ring-1 ring-hairline-strong font-semibold uppercase tracking-[0.18em]",
        "transition-colors duration-300",
        "hover:bg-ink hover:text-cream hover:ring-ink",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
      );
    case "ghost-inverse":
      // Light-outline pill for use over dark photography. Fills to a solid
      // light pill on hover.
      return cn(
        "inline-flex items-center justify-center gap-2 rounded-full",
        "bg-transparent text-ink ring-1 ring-ink/40 font-semibold uppercase tracking-[0.18em]",
        "transition-colors duration-300",
        "hover:bg-ink hover:text-cream hover:ring-ink",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
      );
    case "link":
      return cn(
        "group/qb relative inline-flex items-center gap-1.5",
        "text-ink font-medium uppercase tracking-[0.18em]",
        "transition-colors duration-200 hover:text-accent",
        "focus:outline-none",
      );
  }
}

export function QuietButton(props: QuietButtonProps) {
  const variant = props.variant ?? "primary";
  const size = props.size ?? "md";
  const arrow = props.arrow ?? true;

  const className = cn(
    variantClasses(variant),
    SIZE_CLASS[variant][size],
    props.className,
  );

  const children = (
    <>
      <span>{props.children}</span>
      {arrow && (
        <span
          aria-hidden
          className={cn(
            "ml-0.5 transition-transform duration-300",
            "group-hover/qb:translate-x-1",
          )}
        >
          <ArrowRight
            className={cn(
              variant === "link" ? "h-3.5 w-3.5" : "h-3.5 w-3.5",
            )}
            strokeWidth={1.75}
          />
        </span>
      )}
      {variant === "link" && (
        <span
          aria-hidden
          className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-300 group-hover/qb:scale-x-100"
        />
      )}
    </>
  );

  // We need group/qb on the root so the arrow slide + underline wipe work.
  const rootClassName = cn(className, "group/qb");

  if ("href" in props && props.href !== undefined) {
    return (
      <Link
        href={props.href}
        onClick={props.onClick}
        target={props.target}
        rel={props.rel}
        data-cursor="cta"
        className={rootClassName}
      >
        {children}
      </Link>
    );
  }

  const { type, disabled, onClick, name, value, form, autoFocus } = props as ButtonProps;
  return (
    <button
      type={type ?? "button"}
      disabled={disabled}
      onClick={onClick}
      name={name}
      value={value}
      form={form}
      autoFocus={autoFocus}
      data-cursor="cta"
      className={cn(rootClassName, "disabled:opacity-50 disabled:pointer-events-none")}
    >
      {children}
    </button>
  );
}
