import Image from "next/image";
import { SectionLabel } from "@/components/editorial";
import { cn } from "@/lib/utils";
import type { CheckInStatus } from "@/types";

type Props = {
  /** Pre-rendered QR PNG data URL (from qrDataUrl). */
  qrDataUrl: string;
  checkInStatus?: CheckInStatus;
  className?: string;
};

/**
 * The customer's entry pass: a scannable QR that opens the admin check-in page
 * for this booking. Shown on the confirmation + status screens. Once admitted,
 * the code dims and reads "Admitted".
 */
export function EntryPass({ qrDataUrl, checkInStatus, className }: Props) {
  const admitted = checkInStatus === "admitted";
  const rejected = checkInStatus === "rejected";
  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <SectionLabel>Entry pass</SectionLabel>
      <div className="relative mt-5 rounded-2xl bg-cream p-3 ring-1 ring-hairline">
        <Image
          src={qrDataUrl}
          alt="Booking entry QR code"
          width={220}
          height={220}
          unoptimized
          className={cn(
            "h-[220px] w-[220px] rounded-lg",
            (admitted || rejected) && "opacity-25",
          )}
        />
        {admitted && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-ink px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-cream">
              Admitted
            </span>
          </div>
        )}
        {rejected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-[#9f1d3a] px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-cream">
              Not valid
            </span>
          </div>
        )}
      </div>
      <p className="mt-5 max-w-xs text-[13px] leading-[1.6] text-muted">
        {admitted
          ? "You're checked in — enjoy the show."
          : rejected
            ? "Entry was declined at the door. Please contact the venue if this is unexpected."
            : "Show this at the entrance. Our team scans it to let you in."}
      </p>
    </div>
  );
}
