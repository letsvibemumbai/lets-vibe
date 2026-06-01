import type { Booking, BookingStatus, ScreenId } from "@/types";

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTimeRange(start: string, end: string): string {
  return `${start}–${end}`;
}

export const SCREEN_LABEL: Record<ScreenId, string> = {
  beach: "Beach Vibes",
  grass: "Grass Garden",
  forest: "Forest Retreat",
};

export const STATUS_STYLES: Record<
  BookingStatus,
  { label: string; dot: string; bg: string; text: string; border: string }
> = {
  confirmed: {
    label: "Confirmed",
    dot: "bg-emerald-400",
    bg: "bg-emerald-500/15",
    text: "text-emerald-300",
    border: "border-emerald-500/30",
  },
  pending: {
    label: "Pending",
    dot: "bg-accent",
    bg: "bg-accent/15",
    text: "text-accent",
    border: "border-accent/30",
  },
  completed: {
    label: "Completed",
    dot: "bg-zinc-400",
    bg: "bg-white/10",
    text: "text-foreground/60",
    border: "border-white/15",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-rose-400",
    bg: "bg-rose-500/15",
    text: "text-rose-300",
    border: "border-rose-500/30",
  },
};

export function summarizeAddOns(addOns: Booking["addOns"]): string {
  const parts: string[] = [];
  if (addOns.selections?.length) {
    for (const sel of addOns.selections) {
      parts.push(sel.quantity > 1 ? `${sel.name} ×${sel.quantity}` : sel.name);
    }
  }
  if (addOns.decorations) parts.push("Decorations note");
  return parts.join(" · ");
}
