import { SuccessClient } from "@/components/booking/SuccessClient";
import { getBooking } from "@/lib/db/bookings.server";
import { SCREEN_PRESETS, isScreenId } from "@/lib/booking/constants";
import { QuietButton, SectionLabel } from "@/components/editorial";

export const metadata = { title: "Reserved · Let's Vibe" };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string }>;
}) {
  const { bookingId } = await searchParams;
  if (!bookingId) return <MissingBookingId />;

  let booking;
  try {
    booking = await getBooking(bookingId);
  } catch (e) {
    return <ErrorState message={(e as Error).message} />;
  }
  if (!booking) return <NotFoundState />;
  if (!isScreenId(booking.screenId))
    return <ErrorState message="Invalid screen on booking" />;

  const screen = SCREEN_PRESETS[booking.screenId];

  if (booking.status !== "confirmed") {
    return <PendingState bookingId={booking.id} />;
  }

  return <SuccessClient booking={booking} screen={screen} />;
}

function CenteredCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: { label: string; href: string };
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 border-y border-hairline py-14 text-center">
      <SectionLabel>Note</SectionLabel>
      <h1
        className="font-display text-3xl leading-tight text-ink"
        style={{ fontWeight: 400 }}
      >
        {title}
      </h1>
      <p className="text-[14px] leading-[1.7] text-muted">{children}</p>
      {action && (
        <div className="pt-2">
          <QuietButton href={action.href} variant="primary" size="md">
            {action.label}
          </QuietButton>
        </div>
      )}
    </div>
  );
}

function MissingBookingId() {
  return (
    <CenteredCard
      title="No booking ID"
      action={{ label: "Start a new booking", href: "/book" }}
    >
      The link is missing the booking ID. If you just paid, check WhatsApp or
      email for your confirmation.
    </CenteredCard>
  );
}

function NotFoundState() {
  return (
    <CenteredCard title="Booking not found">
      We couldn&rsquo;t find a booking with that ID. Double-check the link.
    </CenteredCard>
  );
}

function PendingState({ bookingId }: { bookingId: string }) {
  return (
    <CenteredCard
      title="Payment processing"
      action={{ label: "Check status", href: `/book/${bookingId}/status` }}
    >
      We&rsquo;re confirming with the payment gateway. Check the status page
      in a minute.
    </CenteredCard>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <CenteredCard title="Something went wrong">{message}</CenteredCard>
  );
}
