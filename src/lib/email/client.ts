import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Transactional email via Gmail SMTP (nodemailer).
 *
 * Configure in .env.local:
 *   GMAIL_USER=letsvibe.mumbai@gmail.com
 *   GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx   (16-char Google App Password, not the login password)
 *   EMAIL_FROM=Let's Vibe <letsvibe.mumbai@gmail.com>   (optional; defaults to GMAIL_USER)
 *
 * When the credentials are absent the client no-ops (logs a warning and returns
 * { skipped: true }) so booking flows keep working in dev / before setup.
 */

export type SendMailArgs = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
};

export type SendMailResult =
  | { ok: true }
  | { ok: false; skipped: true }
  | { ok: false; skipped?: false; error: string };

let cachedTransport: Transporter | null = null;

export function emailConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

export function defaultFrom(): string {
  return (
    process.env.EMAIL_FROM ||
    `Let's Vibe <${process.env.GMAIL_USER ?? "no-reply@localhost"}>`
  );
}

function getTransport(): Transporter | null {
  if (!emailConfigured()) return null;
  if (cachedTransport) return cachedTransport;
  cachedTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER!,
      pass: process.env.GMAIL_APP_PASSWORD!,
    },
    // Bound the wait — the send is awaited inside the booking action, so a
    // stalled SMTP server must fail fast rather than hang the confirmation.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  return cachedTransport;
}

export async function sendMail(args: SendMailArgs): Promise<SendMailResult> {
  const transport = getTransport();
  if (!transport) {
    console.warn(
      "[email] GMAIL_USER / GMAIL_APP_PASSWORD not set — skipping send to",
      args.to,
    );
    return { ok: false, skipped: true };
  }
  try {
    await transport.sendMail({
      from: defaultFrom(),
      to: args.to,
      cc: args.cc,
      bcc: args.bcc,
      replyTo: args.replyTo,
      subject: args.subject,
      html: args.html,
      text: args.text,
    });
    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : "send failed";
    console.error("[email] sendMail failed:", error);
    return { ok: false, error };
  }
}
