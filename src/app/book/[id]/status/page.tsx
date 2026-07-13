import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBooking } from "@/lib/db/bookings.server";
import { balanceDue, totalCollected } from "@/lib/booking/payments";
import { isScreenId, screenImageUrl } from "@/lib/booking/constants";
import { getScreenResolved } from "@/lib/db/screens.server";
import { qrDataUrl } from "@/lib/qr";
import { buildCheckInUrl } from "@/lib/checkin/token";
import { appUrl } from "@/lib/app-url";
import { EntryPass } from "@/components/booking/EntryPass";
import { SectionLabel } from "@/components/editorial";
import { TimeRange } from "@/components/time/Time";
import type { BookingStatus } from "@/types";

export const metadata = { title: "Booking status · Let's Vibe" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<BookingStatus, { label: string; tone: string }> = {
  pending: { label: "Awaiting confirmation", tone: "text-accent" },
  confirmed: { label: "Confirmed", tone: "text-ink" },
  cancelled: { label: "Cancelled", tone: "text-muted line-through" },
  completed: { label: "Completed", tone: "text-muted" },
};

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function StatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let booking;
  try {
    booking = await getBooking(id);
  } catch (e) {
    return <Card title="Couldn't load booking">{(e as Error).message}</Card>;
  }
  if (!booking) {
    return <Card title="Booking not found">No booking exists with this ID.</Card>;
  }
  if (!isScreenId(booking.screenId)) {
    return <Card title="Booking error">Invalid screen on booking record.</Card>;
  }

  const screen = await getScreenResolved(booking.screenId);
  const status = STATUS_LABEL[booking.status];
  const entryQr =
    booking.status === "confirmed"
      ? await qrDataUrl(buildCheckInUrl(appUrl(), booking.id))
      : null;

  return (
    <div className="mx-auto max-w-2xl">
      <SectionLabel>Booking</SectionLabel>
      <h1
        className="mt-3 font-display text-4xl leading-tight tracking-[-0.02em] text-ink sm:text-5xl"
        style={{ fontWeight: 400 }}
      >
        Your reservation.
      </h1>
      <p className="mt-3 font-mono text-[12px] text-muted">{booking.id}</p>

      <div className="relative mt-8 aspect-[21/9] w-full overflow-hidden rounded-sm bg-cream-tonal">
        <Image
          src={screenImageUrl(screen, 1200)}
          alt={screen.name}
          fill
          sizes="(max-width: 768px) 100vw, 672px"
          className="object-cover photo-grade"
          unoptimized
        />
      </div>

      <div className="mt-8 border-y border-hairline py-10">
        <div className="flex items-baseline justify-between gap-4 border-b border-hairline pb-6">
          <h2
            className="font-display text-3xl leading-none text-ink"
            style={{ fontWeight: 400 }}
          >
            {screen.name}
          </h2>
          <p
            className={cn(
              "text-[11px] font-medium uppercase tracking-[0.22em]",
              status.tone,
            )}
          >
            {status.label}
          </p>
        </div>

        <dl className="mt-7 grid grid-cols-1 gap-5 text-[14px] sm:grid-cols-2">
          <Field icon={Calendar} label="Date" value={formatDate(booking.date)} />
          <Field
            icon={Clock}
            label="Time"
            value={
              <>
                <TimeRange start={booking.startTime} end={booking.endTime} /> ·{" "}
                {booking.duration}h
              </>
            }
          />
          <Field icon={Users} label="Guests" value={String(booking.guestCount)} />
          <Field label="Total" value={`₹${booking.amount.toLocaleString("en-IN")}`} />
          {balanceDue(booking) > 0 ? (
            <>
              <Field
                label="Paid"
                value={`₹${totalCollected(booking).toLocaleString("en-IN")}`}
              />
              <Field
                label="Balance due"
                value={`₹${balanceDue(booking).toLocaleString("en-IN")} · cash / UPI at venue`}
              />
            </>
          ) : (
            <Field label="Payment" value="Paid in full" />
          )}
        </dl>

        <div className="mt-8 border-t border-hairline pt-6 text-[14px] text-muted">
          <p>
            Contact:{" "}
            <span className="text-ink">{booking.customerName}</span> ·{" "}
            {booking.customerPhone}
          </p>
          {booking.customerEmail ? (
            <p className="mt-1">Email: {booking.customerEmail}</p>
          ) : null}
        </div>

        {booking.status === "pending" ? (
          <p className="mt-6 border-t border-hairline pt-5 text-[13px] leading-[1.7] text-muted">
            {booking.paymentScreenshotPath || booking.paymentScreenshotUrl
              ? "We've received your payment screenshot and our team is verifying it. You'll get a confirmation email once your booking is approved — refresh this page anytime to check."
              : "Your booking is awaiting confirmation. You'll get a confirmation email once it's approved."}
          </p>
        ) : null}
      </div>

      {entryQr && (
        <div className="mt-10 border-t border-hairline pt-10">
          <EntryPass qrDataUrl={entryQr} checkInStatus={booking.checkInStatus} />
        </div>
      )}

      <p className="mt-12 text-center text-[11px] uppercase tracking-[0.22em] text-muted">
        <Link href="/" className="transition-colors hover:text-ink">
          ← Back to site
        </Link>
      </p>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      {Icon ? (
        <Icon className="mt-1 h-3.5 w-3.5 text-muted" strokeWidth={1.5} />
      ) : (
        <span className="mt-1 inline-block h-3.5 w-3.5" />
      )}
      <div>
        <dt className="text-[10px] uppercase tracking-[0.22em] text-muted">
          {label}
        </dt>
        <dd className="mt-1 text-[14px] text-ink">{value}</dd>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md border-y border-hairline py-14 text-center">
      <SectionLabel>Note</SectionLabel>
      <h1
        className="mt-4 font-display text-2xl leading-tight text-ink"
        style={{ fontWeight: 400 }}
      >
        {title}
      </h1>
      <p className="mt-3 text-[14px] leading-[1.7] text-muted">{children}</p>
    </div>
  );
}
