import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "./admin-session";

export { SESSION_COOKIE, SESSION_TTL_MS } from "./session-constants";
import { SESSION_COOKIE } from "./session-constants";

export type AdminSession = { username: string };

/**
 * HMAC key for the admin session cookie. Prefers a dedicated
 * `ADMIN_SESSION_SECRET`; falls back to the Firebase admin private key so the
 * cookie is still signed with a strong secret if the dedicated one is unset.
 */
export function adminSessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
    ""
  );
}

export async function getServerSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const cookie = store.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  const payload = verifySession(adminSessionSecret(), cookie);
  if (!payload) return null;
  return { username: process.env.ADMIN_USERNAME || "admin" };
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getServerSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}
