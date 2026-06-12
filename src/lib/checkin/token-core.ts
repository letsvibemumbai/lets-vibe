import crypto from "node:crypto";

/**
 * Pure HMAC token core for the QR entry pass — no env, no `server-only`, so it
 * is unit-testable. The env-bound wrapper lives in ./token.ts.
 */

export const CHECKIN_TOKEN_LEN = 24;

export function signWithSecret(secret: string, bookingId: string): string {
  if (!secret) return "";
  return crypto
    .createHmac("sha256", secret)
    .update(`checkin:${bookingId}`)
    .digest("base64url")
    .slice(0, CHECKIN_TOKEN_LEN);
}

export function verifyWithSecret(
  secret: string,
  bookingId: string,
  token: string | undefined | null,
): boolean {
  if (!secret || !token || typeof token !== "string") return false;
  const expected = signWithSecret(secret, bookingId);
  if (!expected || expected.length !== token.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}
