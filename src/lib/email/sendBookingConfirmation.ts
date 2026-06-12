import "server-only";
import { getBooking, updateBooking } from "@/lib/db/bookings.server";
import { getScreenResolved } from "@/lib/db/screens.server";
import { isScreenId } from "@/lib/booking/constants";
import { appUrl } from "@/lib/app-url";
import { sendMail } from "./client";
import { renderBookingConfirmation } from "./bookingConfirmationTemplate";

/**
 * Send the booking-confirmation email for a booking, exactly once.
 *
 * Safe to call from any code path that confirms a booking — it re-reads the
 * booking and self-guards:
 *   - only sends when status === "confirmed"
 *   - skips if the email was already sent (`confirmationEmailSentAt`)
 *   - skips silently if the booking has no customer email
 *   - never throws: a mail failure must never break a booking. On failure it
 *     leaves `confirmationEmailSentAt` unset so a later confirm event can retry.
 *
 * The business owner (ADMIN_EMAIL) is BCC'd so every confirmed booking lands in
 * their inbox as a notification.
 */
export async function maybeSendBookingConfirmation(
  bookingId: string,
): Promise<void> {
  try {
    const booking = await getBooking(bookingId);
    if (!booking) return;
    if (booking.status !== "confirmed") return;
    if (booking.confirmationEmailSentAt) return; // already sent — idempotent
    if (!booking.customerEmail) return; // nothing to send to
    if (!isScreenId(booking.screenId)) return;

    const screen = await getScreenResolved(booking.screenId);
    const ownerEmail = process.env.ADMIN_EMAIL?.trim() || undefined;

    const { subject, html, text } = renderBookingConfirmation({
      booking,
      screen,
      appUrl: appUrl(),
    });

    const result = await sendMail({
      to: booking.customerEmail,
      bcc: ownerEmail,
      replyTo: ownerEmail,
      subject,
      html,
      text,
    });

    if (result.ok) {
      await updateBooking(bookingId, { confirmationEmailSentAt: Date.now() });
    }
    // Skipped (no creds) or failed → don't stamp, so a future confirm can retry.
  } catch (err) {
    console.error("[email] maybeSendBookingConfirmation failed:", err);
  }
}
