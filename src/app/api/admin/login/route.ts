import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { credentialsMatch, signSession } from "@/lib/auth/admin-session";
import {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  adminSessionSecret,
} from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const BodySchema = z.object({
  username: z.string().min(1).max(200),
  password: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  // Throttle brute-force attempts: burst of 8, then ~1 attempt / 10s per IP.
  const ip = clientIp(req);
  const limit = rateLimit(`admin-login:${ip}`, { capacity: 8, refillPerSec: 0.1 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  const secret = adminSessionSecret();
  if (!expectedUsername || !expectedPassword || !secret) {
    return NextResponse.json(
      { error: "Admin login is not configured on the server." },
      { status: 500 },
    );
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const ok = credentialsMatch(
    { username: body.username, password: body.password },
    { username: expectedUsername, password: expectedPassword },
  );
  if (!ok) {
    return NextResponse.json(
      { error: "Incorrect username or password." },
      { status: 401 },
    );
  }

  const token = signSession(secret, SESSION_TTL_MS);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  return res;
}
