import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, CreditCard, IndianRupee, Receipt, User } from "lucide-react";
import { getBooking, timestampToMillis } from "@/lib/db/bookings.server";
import { listAddonItems, listAddonPackages } from "@/lib/db/addons.server";
import {
  SCREEN_LABEL,
  formatINR,
  summarizeAddOns,
} from "@/components/admin/dashboard/utils";
import { StatusBadge } from "@/components/admin/dashboard/StatusBadge";
import { BookingEditForm } from "@/components/admin/bookings/EditForm";
import { CancelBookingButton } from "@/components/admin/bookings/CancelButton";
import { RefundButton } from "@/components/admin/bookings/RefundButton";

export const metadata = { title: "Booking · Let's Vibe Admin" };
export const dynamic = "force-dynamic";

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
              {booking.startTime}–{booking.endTime}
            </span>
            <span className="text-foreground/30">·</span>
            <span>{booking.duration}h</span>
            <StatusBadge status={booking.status} />
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canRefund && <RefundButton booking={booking} />}
          {canCancel && <CancelBookingButton booking={booking} />}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <Panel title="Edit details" icon={<User className="h-4 w-4" />}>
            <BookingEditForm booking={booking} items={items} packages={packages} />
          </Panel>
        </section>

        <aside className="space-y-4">
          <Panel
            title="Payment"
            icon={<CreditCard className="h-4 w-4" />}
          >
            <dl className="space-y-2 text-sm">
              <Row label="Amount" value={formatINR(booking.amount)} />
              <Row
                label="Amount paid"
                value={formatINR(booking.amountPaid)}
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
              <Row
                label="Method"
                value={
                  booking.paymentMethod
                    ? booking.paymentMethod.toUpperCase()
                    : isOnline
                      ? "RAZORPAY"
                      : "—"
                }
              />
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
    <section className="rounded-3xl bg-card p-6 ring-1 ring-white/10 ">
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
    <div className="flex items-baseline justify-between gap-3 border-b border-white/10 py-1 last:border-0">
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
