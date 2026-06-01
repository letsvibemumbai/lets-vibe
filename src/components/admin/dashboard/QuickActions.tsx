import Link from "next/link";
import { CalendarPlus, Receipt } from "lucide-react";

export function QuickActions() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href="/admin/bookings/new"
        className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-transform hover:scale-[1.03]"
      >
        <CalendarPlus className="h-4 w-4" />
        Add offline booking
      </Link>
      <Link
        href="/admin/expenses"
        className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold text-foreground ring-1 ring-white/10 transition-colors hover:bg-cream-tonal"
      >
        <Receipt className="h-4 w-4" />
        Add expense
      </Link>
    </div>
  );
}
