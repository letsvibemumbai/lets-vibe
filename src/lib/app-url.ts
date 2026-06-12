/**
 * Canonical public base URL of the app (absolute, no trailing slash), resolved
 * for every environment. Used wherever we mint a URL that has to work in a
 * browser away from the server — entry-pass QR codes, confirmation-email links,
 * Open Graph metadata.
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_APP_URL  — explicit override. Set this to your custom domain
 *      in production (and scope it to the Production environment on Vercel so
 *      Preview deployments keep using their own URL).
 *   2. NEXT_PUBLIC_VERCEL_URL — auto-set by Vercel for every deployment
 *      (preview + production). Lets QR / email links point at the exact
 *      deployment with zero manual config — ideal for Vercel testing.
 *   3. http://localhost:3000 — local dev.
 *
 * NEXT_PUBLIC_* vars are inlined at build time, so this is safe to call from
 * both server and client code.
 */
export function appUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return stripTrailingSlash(explicit);

  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL?.trim();
  if (vercel) return `https://${stripTrailingSlash(vercel)}`;

  return "http://localhost:3000";
}

/** True when the resolved URL still points at localhost (dev / misconfigured prod). */
export function isLocalAppUrl(): boolean {
  return appUrl().includes("localhost");
}

function stripTrailingSlash(u: string): string {
  return u.replace(/\/+$/, "");
}
