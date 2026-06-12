import "server-only";
import crypto from "node:crypto";
import { signWithSecret, verifyWithSecret } from "./token-core";

/**
 * Stateless entry token for a booking's QR pass.
 *
 * The token is an HMAC of the booking id with a server-only key. It is NEVER
 * stored in Firestore — booking docs are publicly gettable by id
 * (firestore.rules: `allow get: if true`), so a stored secret would leak. An
 * HMAC that only the server can compute binds a QR to a specific booking and
 * can't be forged without the key. The real entry gate is admin authentication
 * + the admin's human verification; the token is defence in depth (the verify
 * page downgrades an unsigned/tampered QR away from a one-tap admit).
 */

function rawSecret(): string {
  return (
    process.env.CHECKIN_SECRET ||
    process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
    process.env.RAZORPAY_KEY_SECRET ||
    ""
  );
}

/**
 * Derive a dedicated check-in signing key. We never use another subsystem's
 * secret (the Firebase admin key / Razorpay secret) directly as the HMAC key:
 * the one-way SHA-256 derivation with a domain-separation label means a leaked
 * entry token reveals nothing about the source secret and keeps the blast
 * radius isolated to check-in. A dedicated CHECKIN_SECRET is still preferred.
 */
function signingKey(): string {
  const raw = rawSecret();
  if (!raw) return "";
  return crypto
    .createHash("sha256")
    .update(`letsvibe:checkin:v1:${raw}`)
    .digest("base64");
}

export function checkInConfigured(): boolean {
  return rawSecret().length > 0;
}

export function signBooking(bookingId: string): string {
  return signWithSecret(signingKey(), bookingId);
}

export function verifyBookingToken(
  bookingId: string,
  token: string | undefined | null,
): boolean {
  return verifyWithSecret(signingKey(), bookingId, token);
}

/** Absolute URL encoded into the customer's QR — opens the admin verify page. */
export function buildCheckInUrl(appUrl: string, bookingId: string): string {
  const base = (appUrl || "http://localhost:3000").trim().replace(/\/+$/, "");
  return `${base}/admin/check-in/${bookingId}?t=${signBooking(bookingId)}`;
}
