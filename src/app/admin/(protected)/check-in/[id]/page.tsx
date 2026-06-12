import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Hourglass,
  IndianRupee,
  Phone,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { getBooking } from "@/lib/db/bookings.server";
import { verifyBookingToken } from "@/lib/checkin/token";
import {
  evaluateCheckIn,
  type CheckInRecommendation,
} from "@/lib/checkin/evaluate";
import {
  SCREEN_LABEL,
  formatINR,
  summarizeAddOns,
} from "@/components/admin/dashboard/utils";
import { StatusBadge } from "@/components/admin/dashboard/StatusBadge";
import { CheckInActions } from "@/components/admin/checkin/CheckInActions";
import { CollectPaymentPanel } from "@/components/admin/payments/CollectPaymentPanel";
import { balanceDue } from "@/lib/booking/payments";
import { cn } from "@/lib/utils";

export const metadata = { title: "Check-in · Let's Vibe Admin" };
export const dynamic = "force-dynamic";

const REC: Record<
  CheckInRecommendation,
  { label: string; ring: string; text: string; Icon: typeof ShieldCheck }
> = {
  admit: {
    label: "Ready to admit",
    ring: "bg-emerald-500/10 ring-emerald-500/30",
    text: "text-emerald-300",
    Icon: ShieldCheck,
  },
  review: {
    label: "Review before admitting",
    ring: "bg-accent/10 ring-accent/30",
    text: "text-accent",
    Icon: Hourglass,
  },
  block: {
    label: "Do not admit",
    ring: "bg-rose-500/10 ring-rose-500/30",
    text: "text-rose-300",
    Icon: ShieldAlert,
  },
};

export default async function CheckInVerifyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t } = await searchParams;
  const booking = await getBooking(id);

  if (!booking) {
    return (
      <div className="mx-auto max-w-xl space-y-5">
        <BackLink />
        <div className="rounded-3xl bg-rose-500/10 p-6 text-center ring-1 ring-rose-500/30">
          <h1 className="font-display text-2xl text-foreground">
            No booking found
          </h1>
          <p className="mt-2 text-sm text-foreground/60">
            Nothing matches ID <span className="font-mono">{id}</span>. Re-scan
            the QR or look it up under Bookings.
          </p>
        </div>
      </div>
    );
  }

  const tokenValid = verifyBookingToken(id, typeof t === "string" ? t : undefined);
  const ev = evaluateCheckIn(booking);
  // An unsigned / tampered QR must not present a frictionless one-tap admit —
  // downgrade to "review" so the admin gets the confirm-anyway dialog and a
  // clear warning, and confirms identity manually.
  const recommendation =
    !tokenValid && ev.recommendation === "admit" ? "review" : ev.recommendation;
  const warnings = tokenValid
    ? ev.warnings
    : [
        "Unsigned or tampered QR — confirm the guest's identity and this booking before admitting.",
        ...ev.warnings,
      ];
  const rec = REC[recommendation];
  const due = balanceDue(booking);

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <BackLink />

      {/* Recommendation banner */}
      <div className={cn("rounded-3xl p-6 ring-1", rec.ring)}>
        <div className="flex items-center gap-3">
          <rec.Icon className={cn("h-7 w-7 shrink-0", rec.text)} strokeWidth={2} />
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-foreground/50">
              Entry check
            </p>
            <h1 className={cn("font-display text-3xl leading-tight", rec.text)}>
              {rec.label}
            </h1>
          </div>
        </div>
        {warnings.length > 0 && (
          <ul className="mt-4 space-y-1.5 border-t border-white/10 pt-4 text-sm text-foreground/80">
            {warnings.map((w) => (
              <li key={w} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current" />
                {w}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* QR signature + current entry state chips */}
      <div className="flex flex-wrap items-center gap-2">
        {tokenValid ? (
          <Chip tone="ok" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
            QR signature verified
          </Chip>
        ) : (
          <Chip tone="warn" icon={<ShieldAlert className="h-3.5 w-3.5" />}>
            QR not verified — confirm details manually
          </Chip>
        )}
        {ev.alreadyAdmitted && (
          <Chip tone="ok" icon={<ScanLine className="h-3.5 w-3.5" />}>
            Admitted
            {booking.checkedInAt
              ? ` · ${format(booking.checkedInAt, "p")}`
              : ""}
          </Chip>
        )}
        {ev.alreadyRejected && (
          <Chip tone="bad" icon={<ShieldAlert className="h-3.5 w-3.5" />}>
            Previously rejected
          </Chip>
        )}
      </div>

      {/* Booking details */}
      <section className="rounded-3xl bg-card p-6 ring-1 ring-hairline">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl text-foreground">
            {booking.customerName}
          </h2>
          <StatusBadge status={booking.status} />
        </div>
        <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Detail
            icon={<Sparkles className="h-4 w-4" />}
            label="Room"
            value={SCREEN_LABEL[booking.screenId]}
          />
          <Detail
            icon={<CalendarDays className="h-4 w-4" />}
            label="Date"
            value={format(new Date(`${booking.date}T00:00:00`), "EEE, d MMM yyyy")}
          />
          <Detail
            icon={<Clock className="h-4 w-4" />}
            label="Slot"
            value={`${booking.startTime} – ${booking.endTime} · ${booking.duration}h`}
          />
          <Detail
            icon={<Users className="h-4 w-4" />}
            label="Guests"
            value={String(booking.guestCount)}
          />
          <Detail
            icon={<Phone className="h-4 w-4" />}
            label="Phone"
            value={booking.customerPhone}
            mono
          />
          <Detail
            icon={<IndianRupee className="h-4 w-4" />}
            label="Amount"
            value={`${formatINR(booking.amount)} · ${due <= 0 ? "Paid" : `${formatINR(due)} due`}`}
          />
        </dl>
        {summarizeAddOns(booking.addOns) && (
          <p className="mt-4 border-t border-hairline pt-4 text-sm text-foreground/70">
            <span className="text-foreground/45">Add-ons · </span>
            {summarizeAddOns(booking.addOns)}
          </p>
        )}
        {booking.checkInNote && (
          <p className="mt-2 text-sm text-foreground/60">
            <span className="text-foreground/45">Door note · </span>
            {booking.checkInNote}
          </p>
        )}
        <p className="mt-4 border-t border-hairline pt-3 font-mono text-[11px] text-foreground/40">
          {booking.id}
        </p>
      </section>

      <CheckInActions
        booking={booking}
        recommendation={recommendation}
        warnings={warnings}
      />

      {/* Balance collection at the door */}
      <section className="rounded-3xl bg-card p-6 ring-1 ring-hairline">
        <header className="mb-4 flex items-center gap-2 text-foreground/70">
          <IndianRupee className="h-4 w-4" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">
            Payment
          </h2>
        </header>
        <CollectPaymentPanel booking={booking} />
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/check-in"
      className="inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to scanner
    </Link>
  );
}

function Chip({
  tone,
  icon,
  children,
}: {
  tone: "ok" | "warn" | "bad";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const styles = {
    ok: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
    warn: "bg-accent/10 text-accent ring-accent/30",
    bad: "bg-rose-500/10 text-rose-300 ring-rose-500/30",
  }[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1",
        styles,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

function Detail({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-foreground/40">{icon}</span>
      <div className="min-w-0">
        <dt className="text-[10px] uppercase tracking-[0.18em] text-foreground/45">
          {label}
        </dt>
        <dd
          className={cn(
            "mt-0.5 text-sm text-foreground",
            mono && "font-mono text-[13px]",
          )}
        >
          {value}
        </dd>
      </div>
    </div>
  );
}
