import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session-constants";

// NOTE: This runs on the Edge runtime. We do a cheap cookie-presence check
// here; the real HMAC verification happens in the admin layout via
// `requireAdmin()` (Node runtime). Both layers redirect to /admin/login when
// auth is missing or invalid, so the presence check can't be used to bypass
// the layout's signature check.
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

// Protect everything under /admin EXCEPT the login page.
export const config = {
  matcher: ["/admin", "/admin/((?!login).*)"],
};
