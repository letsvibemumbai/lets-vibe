import crypto from "node:crypto";

/**
 * Pure HMAC session token for the username/password admin login — no env, no
 * `server-only`, so it stays unit-testable (mirrors the QR token-core pattern).
 * The secret + credentials are resolved from env by the callers (the login
 * route and `session.ts`).
 *
 * Token shape: `base64url(json payload) + "." + base64url(hmac-sha256)`.
 */

export type AdminSessionPayload = {
  sub: "admin";
  /** issued-at (epoch ms) */
  iat: number;
  /** expiry (epoch ms) */
  exp: number;
};

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

/** Sign a fresh admin session token valid for `ttlMs`. Returns "" with no secret. */
export function signSession(
  secret: string,
  ttlMs: number,
  now: number = Date.now(),
): string {
  if (!secret) return "";
  const payload: AdminSessionPayload = { sub: "admin", iat: now, exp: now + ttlMs };
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

/**
 * Verify a token's signature + expiry. Returns the payload when valid, else
 * null. Signature comparison is constant-time.
 */
export function verifySession(
  secret: string,
  token: string | undefined | null,
  now: number = Date.now(),
): AdminSessionPayload | null {
  if (!secret || !token || typeof token !== "string") return null;
  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  if (expected.length !== sig.length) return null;
  let ok = false;
  try {
    ok = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return null;
  }
  if (!ok) return null;

  let payload: AdminSessionPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (
    !payload ||
    payload.sub !== "admin" ||
    typeof payload.exp !== "number" ||
    now > payload.exp
  ) {
    return null;
  }
  return payload;
}

/** Constant-time equality of two strings (hashes to a fixed length first so
 * neither the length nor the content leaks through timing). */
function safeEqual(a: string, b: string): boolean {
  const ah = crypto.createHash("sha256").update(a).digest();
  const bh = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ah, bh);
}

/** Constant-time check of submitted admin credentials against the expected
 * pair. Both fields must match; empty expected values never match. */
export function credentialsMatch(
  submitted: { username: string; password: string },
  expected: { username: string; password: string },
): boolean {
  if (!expected.username || !expected.password) return false;
  // Evaluate both (no short-circuit) so timing doesn't reveal which field failed.
  const userOk = safeEqual(submitted.username, expected.username);
  const passOk = safeEqual(submitted.password, expected.password);
  return userOk && passOk;
}
