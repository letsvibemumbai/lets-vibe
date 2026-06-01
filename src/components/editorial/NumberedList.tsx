import * as React from "react";
import { cn } from "@/lib/utils";

type Item = {
  title: string;
  body: string;
};

type Props = {
  items: ReadonlyArray<Item>;
  className?: string;
  invert?: boolean;
};

/**
 * Editorial numbered list. Fraunces light numerals on the left, content
 * on the right. Lots of vertical air between rows.
 */
export function NumberedList({ items, className, invert }: Props) {
  return (
    <ol
      className={cn(
        "divide-y",
        invert ? "divide-cream/15" : "divide-hairline",
        className,
      )}
    >
      {items.map((item, i) => (
        <li
          key={item.title}
          className="grid grid-cols-[auto_1fr] items-start gap-x-8 gap-y-3 py-10 sm:gap-x-16 sm:py-14"
        >
          <span
            className={cn(
              "font-display text-5xl leading-none tracking-tight tabular-nums sm:text-6xl md:text-7xl",
              invert ? "text-cream/30" : "text-ink/25",
            )}
            style={{ fontWeight: 300 }}
            aria-hidden
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="flex flex-col gap-3 sm:max-w-2xl">
            <h3
              className={cn(
                "font-display text-2xl leading-tight tracking-[-0.01em] sm:text-3xl",
                invert ? "text-cream" : "text-ink",
              )}
              style={{ fontWeight: 400 }}
            >
              {item.title}
            </h3>
            <p
              className={cn(
                "text-[15px] leading-[1.65]",
                invert ? "text-cream/70" : "text-muted",
              )}
            >
              {item.body}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
