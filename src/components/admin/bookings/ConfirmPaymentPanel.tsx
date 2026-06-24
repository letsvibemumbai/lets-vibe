"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { confirmUpiBookingAction } from "@/app/actions/admin-bookings";
import { onlinePortion } from "@/lib/booking/payments";
import { formatINR } from "@/components/admin/dashboard/utils";
import { cn } from "@/lib/utils";
import type { Booking } from "@/types";

type Props = {
  booking: Booking;
  /** Server-resolved screenshot src — a short-lived signed URL for private
   * blobs (newer bookings) or the legacy public URL. `null` ⇒ no screenshot
   * (or the underlying object was deleted). */
  screenshotSrc: string | null;
};

/**
 * Admin verification panel for a UPI booking: shows the customer's uploaded
 * payment screenshot and a one-click confirm that records the UPI payment,
 * flips the booking to confirmed, and sends the confirmation email.
 */
export function ConfirmPaymentPanel({ booking, screenshotSrc }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [zoom, setZoom] = useState(false);

  const plan = booking.paymentPlan ?? "full";
  const willRecord = onlinePortion(booking.amount, plan);
  const isPending = booking.status === "pending";
  const confirmed = booking.paymentStatus === "CONFIRMED" || booking.status === "confirmed";

  function onConfirm() {
    startTransition(async () => {
      try {
        await confirmUpiBookingAction(booking.id);
        toast.success("Booking confirmed — confirmation email sent.");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Confirm failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-foreground/70">Payment status</span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
            confirmed
              ? "bg-emerald-500/15 text-emerald-700 ring-emerald-500/25"
              : "bg-amber-500/15 text-amber-700 ring-amber-500/25",
          )}
        >
          {confirmed ? (
            <>
              <Check className="h-3 w-3" strokeWidth={2.5} /> Verified
            </>
          ) : (
            "Awaiting verification"
          )}
        </span>
      </div>

      {screenshotSrc ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setZoom((z) => !z)}
            className="block w-full overflow-hidden rounded-2xl bg-cream ring-1 ring-hairline"
          >
            <Image
              src={screenshotSrc}
              alt="Customer payment screenshot"
              width={520}
              height={520}
              unoptimized
              className={cn(
                "w-full object-contain transition-all",
                zoom ? "max-h-[640px]" : "max-h-72",
              )}
            />
          </button>
          <a
            href={screenshotSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-foreground/55 hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" />
            Open full image
          </a>
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-hairline-strong bg-cream/40 px-4 py-6 text-center text-sm text-foreground/55">
          {booking.paymentScreenshotPath || booking.paymentScreenshotUrl
            ? "Screenshot link expired — refresh the page to mint a new one."
            : "No payment screenshot was uploaded for this booking."}
        </p>
      )}

      {isPending && (
        <div className="space-y-2 border-t border-hairline pt-4">
          <p className="text-xs text-foreground/60">
            Confirming records a{" "}
            <span className="font-medium text-foreground">
              {formatINR(willRecord)}
            </span>{" "}
            UPI payment
            {plan === "deposit"
              ? " (50% deposit — balance due at the venue)"
              : ""}
            , marks the booking confirmed, and emails the customer.
          </p>
          <Button onClick={onConfirm} disabled={pending} className="w-full">
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Confirm payment &amp; booking
          </Button>
        </div>
      )}
    </div>
  );
}
