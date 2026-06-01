import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase/admin";

export { SESSION_COOKIE, SESSION_TTL_MS } from "./session-constants";
import { SESSION_COOKIE } from "./session-constants";

export type AdminSession = { email: string };

export async function getServerSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const cookie = store.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(cookie, true);
    if (!decoded.email) return null;

    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    if (!adminEmail || decoded.email.toLowerCase() !== adminEmail) {
      return null;
    }
    return { email: decoded.email };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getServerSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}
