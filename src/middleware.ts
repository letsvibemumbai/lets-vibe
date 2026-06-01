import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session-constants";

// NOTE: This runs on the Edge runtime, which can't load firebase-admin (it
// requires Node APIs). We do a cheap cookie-presence check here; the real
// cryptographic verification happens in the admin layout via `requireAdmin()`.
// Both layers redirect to /admin/login when auth is missing or invalid, so an
// attacker can't bypass the layout's verifySessionCookie() check.
export function middleware(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// Protect everything under /admin EXCEPT the login + magic-link callback pages.
export const config = {
  matcher: ["/admin", "/admin/((?!login|auth(?:/|$)).*)"],
};
