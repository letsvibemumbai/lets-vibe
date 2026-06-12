import Image from "next/image";
import { cn } from "@/lib/utils";
import { SectionLabel } from "@/components/editorial";
import { experienceName } from "@/lib/booking/addons";
import { screenImageUrl } from "@/lib/booking/constants";
import type { Booking, Screen } from "@/types";

type Props = {
  screen: Screen;
  date?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  guestCount?: number;
  addOns?: Booking["addOns"];
  amount: number;
  className?: string;
};

function formatDate(date?: string): string {
  if (!date) return "—";
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Editorial ledger. Line items left, prices right-aligned. Total in
 * Fraunces light at the bottom.
 */
export function BookingSummary({
  screen,
  date,
  startTime,
  endTime,
  duration,
  guestCount,
  addOns,
  amount,
  className,
}: Props) {
  const selections = addOns?.selections ?? [];
  const basePerHour = duration ? Math.round((amount - selections.reduce((s, sel) => s + sel.unitPrice * sel.quantity, 0)) / Math.max(1, duration)) : 0;
  const baseTotal = basePerHour * (duration ?? 0);
  // The experience selection reads as part of the room, so it leads the ledger.
  const orderedSelections = [
    ...selections.filter((sel) => sel.experience),
    ...selections.filter((sel) => !sel.experience),
  ];

  return (
    <div className={cn("border-y border-hairline py-10", className)}>
      <div className="relative mb-7 aspect-[16/9] w-full overflow-hidden rounded-sm bg-cream-tonal">
        <Image
          src={screenImageUrl(screen, 1000)}
          alt={screen.name}
          fill
          sizes="(max-width: 1024px) 100vw, 640px"
          className="object-cover photo-grade"
          unoptimized
        />
      </div>
      <SectionLabel>Your reservation</SectionLabel>

      <dl className="mt-6 space-y-3 text-[14px]">
        <Row label="Room" value={screen.name} />
        <Row label="Experience" value={experienceName(addOns)} />
        <Row label="Date" value={formatDate(date)} />
        <Row
          label="Time"
          value={startTime && endTime ? `${startTime} – ${endTime}` : "—"}
        />
        <Row
          label="Duration"
          value={duration ? `${duration} hour${duration > 1 ? "s" : ""}` : "—"}
        />
        {guestCount ? <Row label="Guests" value={String(guestCount)} /> : null}
      </dl>

      <div className="mt-8 border-t border-hairline pt-6">
        <SectionLabel>Ledger</SectionLabel>
        <ul className="mt-5 space-y-3 text-[14px]">
          {duration && baseTotal > 0 ? (
            <LedgerRow
              label={`Room · ${duration} hour${duration > 1 ? "s" : ""}`}
              amount={baseTotal}
            />
          ) : null}
          {orderedSelections.map((sel) => (
            <LedgerRow
              key={`${sel.kind}-${sel.id}`}
              label={
                sel.quantity > 1
                  ? `${sel.name} × ${sel.quantity}`
                  : sel.name
              }
              amount={sel.unitPrice * sel.quantity}
            />
          ))}
        </ul>
      </div>

      {addOns?.decorations ? (
        <div className="mt-6 border-t border-hairline pt-6">
          <SectionLabel>Note</SectionLabel>
          <p className="mt-3 text-[14px] leading-[1.7] text-muted">
            {addOns.decorations}
          </p>
        </div>
      ) : null}

      <div className="mt-8 flex items-baseline justify-between border-t border-hairline pt-6">
        <SectionLabel>Total</SectionLabel>
        <p
          className="font-display text-3xl leading-none tracking-[-0.01em] text-ink"
          style={{ fontWeight: 400 }}
        >
          ₹{amount.toLocaleString("en-IN")}
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}

function LedgerRow({ label, amount }: { label: string; amount: number }) {
  return (
    <li className="flex items-baseline justify-between gap-4">
      <span className="text-muted">{label}</span>
      <span className="shrink-0 tabular-nums text-ink">
        ₹{amount.toLocaleString("en-IN")}
      </span>
    </li>
  );
}
