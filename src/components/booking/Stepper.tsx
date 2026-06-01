import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ScreenId } from "@/types";

const STEPS = [
  { id: 1, label: "Screen" },
  { id: 2, label: "Date & time" },
  { id: 3, label: "Details" },
  { id: 4, label: "Payment" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

function hrefFor(step: StepId, screenId?: ScreenId): string | null {
  if (step === 1) return "/book";
  if (!screenId) return null;
  if (step === 2) return `/book/${screenId}`;
  if (step === 3) return `/book/${screenId}/details`;
  return null;
}

type Props = {
  current: 1 | 2 | 3 | 4;
  screenId?: ScreenId;
};

/**
 * Thin horizontal line with four dots. Active = filled ink. Completed =
 * filled accent. Upcoming = outlined.
 */
export function Stepper({ current, screenId }: Props) {
  return (
    <nav aria-label="Booking progress" className="mb-12">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
          Step {String(current).padStart(2, "0")} / 04
        </p>
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-ink/80">
          {STEPS[current - 1].label}
        </p>
      </div>

      <ol className="mt-4 flex items-center gap-2">
        {STEPS.map((step, idx) => {
          const status =
            step.id < current ? "done" : step.id === current ? "active" : "future";
          const href = status === "done" ? hrefFor(step.id, screenId) : null;
          const isLast = idx === STEPS.length - 1;

          const dot = (
            <span
              className={cn(
                "block h-2 w-2 shrink-0 rounded-full transition-colors",
                status === "done" && "bg-accent",
                status === "active" && "bg-ink",
                status === "future" && "border border-hairline-strong bg-transparent",
              )}
            />
          );

          const line = !isLast ? (
            <span
              aria-hidden
              className={cn(
                "h-px flex-1 transition-colors",
                step.id < current ? "bg-accent/50" : "bg-hairline",
              )}
            />
          ) : null;

          return (
            <li key={step.id} className={cn("flex items-center gap-2", !isLast && "flex-1")}>
              {href ? (
                <Link
                  href={href}
                  aria-label={`Back to ${step.label}`}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full transition-opacity hover:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
                >
                  {dot}
                </Link>
              ) : (
                <span className="inline-flex h-5 w-5 items-center justify-center">
                  {dot}
                </span>
              )}
              {line}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
