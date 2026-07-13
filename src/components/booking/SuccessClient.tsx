"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { QuietButton, SectionLabel } from "@/components/editorial";
import { EntryPass } from "@/components/booking/EntryPass";
import { TimeRange, TimeText } from "@/components/time/Time";
import { useTimeFormat } from "@/components/time/TimeFormatProvider";
import { formatClockRange } from "@/lib/time";
import { screenImageUrl } from "@/lib/booking/constants";
import { balanceDue, totalCollected } from "@/lib/booking/payments";
import type { Booking, Screen } from "@/types";

type Props = { booking: Booking; screen: Screen; entryQr: string };

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Editorial success screen. A thin ink stroked checkmark draws in, then
 * "Reserved." in Fraunces italic. No confetti, no exclamation, no bouncing.
 */
export function SuccessClient({ booking, screen, entryQr }: Props) {
  const { format } = useTimeFormat();
  const collected = totalCollected(booking);
  const due = balanceDue(booking);
  const shareText = `Reserved ${screen.name} on Let's Vibe — ${formatDate(
    booking.date,
  )}, ${formatClockRange(booking.startTime, booking.endTime, format, "–")}. Booking ${booking.id}.`;

  const waHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  async function copyId() {
    try {
      await navigator.clipboard.writeText(booking.id);
      toast.success("Booking ID copied");
    } catch {
      toast.error("Couldn't copy — select and copy manually");
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center">
      {/* Stroked checkmark */}
      <motion.svg
        width="56"
        height="56"
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="text-ink"
      >
        <motion.circle
          cx="28"
          cy="28"
          r="26"
          stroke="currentColor"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
        />
        <motion.path
          d="M16 28.5L24 36.5L40 20.5"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="square"
          strokeLinejoin="miter"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1], delay: 0.4 }}
        />
      </motion.svg>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1], delay: 1.0 }}
        className="mt-12 flex flex-col items-center gap-4 text-center"
      >
        <SectionLabel>Confirmed</SectionLabel>
        <h1
          className="font-display text-5xl italic leading-none tracking-[-0.02em] text-ink sm:text-6xl"
          style={{ fontWeight: 300 }}
        >
          Reserved.
        </h1>
        <p className="max-w-md text-[15px] leading-[1.7] text-muted">
          We&rsquo;ll see you on{" "}
          <span className="text-ink">{formatDate(booking.date)}</span> from{" "}
          <span className="text-ink">
            <TimeText value={booking.startTime} />
          </span>{" "}
          to{" "}
          <span className="text-ink">
            <TimeText value={booking.endTime} />
          </span>
          .
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1], delay: 1.3 }}
        className="mt-14 w-full border-y border-hairline py-8"
      >
        <div className="relative mb-7 aspect-[21/9] w-full overflow-hidden rounded-sm bg-cream-tonal">
          <Image
            src={screenImageUrl(screen, 1200)}
            alt={screen.name}
            fill
            sizes="(max-width: 768px) 100vw, 672px"
            className="object-cover photo-grade"
            unoptimized
          />
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <SectionLabel>Booking ID · save this</SectionLabel>
            <p className="mt-2 font-mono text-[15px] text-ink">{booking.id}</p>
          </div>
          <button
            type="button"
            onClick={copyId}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-muted transition-colors hover:text-ink"
          >
            <Copy className="h-3 w-3" strokeWidth={1.75} />
            Copy
          </button>
        </div>

        <dl className="mt-7 grid grid-cols-2 gap-y-3 text-[13px]">
          <Row label="Room" value={screen.name} />
          <Row
            label="Time"
            value={<TimeRange start={booking.startTime} end={booking.endTime} />}
          />
          <Row
            label="Duration"
            value={`${booking.duration} hour${booking.duration > 1 ? "s" : ""}`}
          />
          <Row label="Guests" value={String(booking.guestCount)} />
          <Row
            label="Total"
            value={`₹${booking.amount.toLocaleString("en-IN")}`}
          />
          {due > 0 ? (
            <>
              <Row
                label="Paid now"
                value={`₹${collected.toLocaleString("en-IN")}`}
              />
              <Row
                label="Due at venue"
                value={`₹${due.toLocaleString("en-IN")} · cash / UPI`}
              />
            </>
          ) : (
            <Row label="Paid" value="In full" />
          )}
        </dl>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1], delay: 1.45 }}
        className="mt-12 w-full border-t border-hairline pt-10"
      >
        <EntryPass qrDataUrl={entryQr} checkInStatus={booking.checkInStatus} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1], delay: 1.6 }}
        className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
      >
        <QuietButton href={waHref} variant="link" size="md" arrow>
          Share via WhatsApp
        </QuietButton>
        <Link
          href={`/book/${booking.id}/status`}
          className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted transition-colors hover:text-ink"
        >
          Track booking
        </Link>
      </motion.div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <dt className="text-[10px] uppercase tracking-[0.22em] text-muted">
        {label}
      </dt>
      <dd className="text-right text-ink">{value}</dd>
    </>
  );
}
