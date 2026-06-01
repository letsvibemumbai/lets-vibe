import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/types";
import { STATUS_STYLES } from "./utils";

export function StatusBadge({ status }: { status: BookingStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        s.bg,
        s.text,
        s.border,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}
