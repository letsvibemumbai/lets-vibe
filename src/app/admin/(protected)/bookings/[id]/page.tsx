import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  CreditCard,
  FileDown,
  IndianRupee,
  QrCode,
  Receipt,
  ScanLine,
  ShieldCheck,
  User,
} from "lucide-react";
import { getBooking, timestampToMillis } from "@/lib/db/bookings.server";
import { listAddonItems, listAddonPackages } from "@/lib/db/addons.server";
import { signedReadUrl } from "@/lib/storage/upload";
import {
  SCREEN_LABEL,
  formatINR,
  summarizeAddOns,
} from "@/components/admin/dashboard/utils";
import { StatusBadge } from "@/components/admin/dashboard/StatusBadge";
import { BookingEditForm } from "@/components/admin/bookings/EditForm";
import { CancelBookingButton } from "@/components/admin/bookings/CancelButton";
import { ConfirmPaymentPanel } from "@/components/admin/bookings/ConfirmPaymentPanel";
import { RefundButton } from "@/components/admin/bookings/RefundButton";
import { CollectPaymentPanel } from "@/components/admin/payments/CollectPaymentPanel";
import { TimeRange } from "@/components/time/Time";
import type { CheckInStatus } from "@/types";

export const metadata = { title: "Booking · Let's Vibe Admin" };
export const dynamic = "force-dynamic";

const ENTRY_LABEL: Record<CheckInStatus, string> = {
  awaiting: "Awaiting",
  admitted: "Admitted",
  rejected: "Rejected",
};

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [booking, items, packages] = await Promise.all([
    getBooking(id),
    listAddonItems(),
    listAddonPackages(),
  ]);
  if (!booking) notFound();

  const createdMs = timestampToMillis(booking.createdAt);
  const updatedMs = timestampToMillis(booking.updatedAt);
  const isOnline = booking.source === "online";
  const canRefund =
    isOnline &&
    !!booking.razorpayPaymentId &&
    !booking.razorpayRefundId &&
    booking.amountPaid > 0;
  const canCancel =
    booking.status !== "cancelled" && booking.status !== "completed";
  const hasScreenshot =
    !!booking.paymentScreenshotPath || !!booking.paymentScreenshotUrl;
  const showPaymentVerification =
    hasScreenshot ||
    booking.paymentStatus !== undefined ||
    (isOnline && booking.status === "pending");
  // Resolve the screenshot src server-side: prefer a short-lived signed URL
  // off the private storage path; fall back to the legacy public URL for
  // bookings created before the upload became private.
  const screenshotSrc = booking.paymentScreenshotPath
    ? await signedReadUrl(booking.paymentScreenshotPath)
    : booking.paymentScreenshotUrl ?? null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/admin/bookings"
        className="inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to bookings
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-foreground">
            {booking.customerName}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-foreground/60">
            <span>{SCREEN_LABEL[booking.screenId]}</span>
            <span className="text-foreground/30">·</span>
            <span>{booking.date}</span>
            <span className="text-foreground/30">·</span>
            <span>
              <TimeRange start={booking.startTime} end={booking.endTime} />
            </span>
            <span className="text-foreground/30">·</span>
            <span>{booking.duration}h</span>
            <StatusBadge status={booking.status} />
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/admin/bookings/${booking.id}/receipt`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-foreground/80 ring-1 ring-hairline-strong transition-colors hover:bg-card"
          >
            <FileDown className="h-3.5 w-3.5" />
            Download receipt
          </a>
          <Link
            href={`/admin/check-in/${booking.id}`}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-foreground/80 ring-1 ring-hairline-strong transition-colors hover:bg-card"
          >
            <QrCode className="h-3.5 w-3.5" />
            Door check-in
          </Link>
          {canRefund && <RefundButton booking={booking} />}
          {canCancel && <CancelBookingButton booking={booking} />}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          {showPaymentVerification && (
            <Panel
              title="Payment verification"
              icon={<ShieldCheck className="h-4 w-4" />}
            >
              <ConfirmPaymentPanel booking={booking} screenshotSrc={screenshotSrc} />
            </Panel>
          )}
          <Panel title="Edit details" icon={<User className="h-4 w-4" />}>
            <BookingEditForm booking={booking} items={items} packages={packages} />
          </Panel>
        </section>

        <aside className="space-y-4">
          <Panel
            title="Payment"
            icon={<CreditCard className="h-4 w-4" />}
          >
            <CollectPaymentPanel booking={booking} />
            <dl className="mt-5 space-y-2 border-t border-hairline pt-4 text-sm">
              <Row
                label="Plan"
                value={
                  booking.paymentPlan === "deposit"
                    ? "50% deposit"
                    : booking.paymentPlan === "full"
                      ? "Paid in full"
                      : "—"
                }
              />
              {booking.originalAmount !== undefined &&
                booking.originalAmount !== booking.amount && (
                  <Row
                    label="Original price"
                    value={formatINR(booking.originalAmount)}
                  />
                )}
              {!!booking.discount && (
                <Row
                  label="Discount"
                  value={`− ${formatINR(booking.discount)}`}
                />
              )}
              <Row label="Source" value={booking.source} className="capitalize" />
              {booking.razorpayOrderId && (
                <Row
                  label="Order"
                  value={booking.razorpayOrderId}
                  mono
                />
              )}
              {booking.razorpayPaymentId && (
                <Row
                  label="Payment"
                  value={booking.razorpayPaymentId}
                  mono
                />
              )}
              {booking.razorpayRefundId && (
                <Row
                  label="Refund"
                  value={booking.razorpayRefundId}
                  mono
                />
              )}
            </dl>
          </Panel>

          <Panel
            title="Booking summary"
            icon={<Receipt className="h-4 w-4" />}
          >
            <dl className="space-y-2 text-sm">
              <Row label="Guests" value={booking.guestCount} />
              <Row
                label="Add-ons"
                value={summarizeAddOns(booking.addOns) || "—"}
              />
              <Row label="Email" value={booking.customerEmail || "—"} />
              <Row label="Phone" value={booking.customerPhone} mono />
            </dl>
          </Panel>

          <Panel title="Audit log" icon={<IndianRupee className="h-4 w-4" />}>
            <dl className="space-y-2 text-sm">
              <Row
                label="Created"
                value={createdMs ? format(createdMs, "PPp") : "—"}
              />
              <Row
                label="Updated"
                value={updatedMs ? format(updatedMs, "PPp") : "—"}
              />
              {booking.cancelledAt && (
                <Row
                  label="Cancelled"
                  value={format(booking.cancelledAt, "PPp")}
                />
              )}
              {booking.refundedAt && (
                <Row
                  label="Refunded"
                  value={format(booking.refundedAt, "PPp")}
                />
              )}
              <Row label="Booking ID" value={booking.id} mono />
            </dl>
          </Panel>

          <Panel title="Entry" icon={<ScanLine className="h-4 w-4" />}>
            <dl className="space-y-2 text-sm">
              <Row
                label="Door status"
                value={ENTRY_LABEL[booking.checkInStatus ?? "awaiting"]}
              />
              {booking.checkInStatus === "admitted" && booking.checkedInAt && (
                <Row label="Admitted" value={format(booking.checkedInAt, "PPp")} />
              )}
              {booking.checkInStatus === "rejected" &&
                booking.checkInRejectedAt && (
                  <Row
                    label="Rejected"
                    value={format(booking.checkInRejectedAt, "PPp")}
                  />
                )}
              {booking.checkInNote && (
                <Row label="Door note" value={booking.checkInNote} />
              )}
            </dl>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-card p-6 ring-1 ring-hairline ">
      <header className="mb-4 flex items-center gap-2 text-foreground/70">
        {icon}
        <h2 className="text-sm font-semibold uppercase tracking-wider">
          {title}
        </h2>
      </header>
      {children}
    </section>
  );
}

function Row({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-hairline py-1 last:border-0">
      <dt className="text-xs uppercase tracking-wider text-foreground/45">
        {label}
      </dt>
      <dd
        className={`text-right text-foreground ${mono ? "font-mono text-[11px]" : ""} ${className ?? ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
