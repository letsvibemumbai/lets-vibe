import { experienceName } from "@/lib/booking/addons";
import { screenImageUrl } from "@/lib/booking/constants";
import { balanceDue, totalCollected } from "@/lib/booking/payments";
import type { Booking, Screen } from "@/types";

type Args = {
  booking: Booking;
  screen: Screen;
  /** Public base URL, e.g. https://letsvibe.in (no trailing slash). */
  appUrl: string;
};

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

// Brand palette (mirrors the site).
const COLORS = {
  pageBg: "#efe7da",
  card: "#fbf8f2",
  ink: "#1a1612",
  muted: "#6b6358",
  accent: "#c89b3c",
  hairline: "#e7ddcf",
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function formatDateLong(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime12(hhmm: string): string {
  const [hRaw, m] = hhmm.split(":");
  const h = Number(hRaw);
  if (Number.isNaN(h)) return hhmm;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m ?? "00"} ${period}`;
}

function selectionLabel(name: string, quantity: number): string {
  return quantity > 1 ? `${name} × ${quantity}` : name;
}

export function renderBookingConfirmation({
  booking,
  screen,
  appUrl,
}: Args): RenderedEmail {
  const firstName = (booking.customerName || "there").split(" ")[0];
  const dateLong = formatDateLong(booking.date);
  const timeRange = `${formatTime12(booking.startTime)} – ${formatTime12(booking.endTime)}`;
  const durationLabel = `${booking.duration} hour${booking.duration > 1 ? "s" : ""}`;
  const experienceLabel = experienceName(booking.addOns);
  const image = screenImageUrl(screen, 1200);
  const statusUrl = `${appUrl}/book/${booking.id}/status`;
  const selections = booking.addOns?.selections ?? [];
  const decorations = booking.addOns?.decorations;
  const collected = totalCollected(booking);
  const due = balanceDue(booking);
  const paymentNote =
    due <= 0
      ? collected > 0
        ? `Paid in full · ${inr(collected)}`
        : "Pay at the venue — cash or UPI."
      : collected > 0
        ? `Paid ${inr(collected)} · ${inr(due)} due at the venue (cash / UPI)`
        : `${inr(due)} due at the venue — cash or UPI on arrival`;

  const subject = `Booking confirmed — ${screen.name}, ${formatDateLong(
    booking.date,
  )}`;

  // ---- Detail rows ----
  const detailRows: Array<[string, string]> = [
    ["Room", screen.name],
    ["Experience", experienceLabel],
    ["Date", dateLong],
    ["Time", timeRange],
    ["Duration", durationLabel],
    ["Guests", String(booking.guestCount)],
  ];

  const detailRowsHtml = detailRows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:9px 0;border-bottom:1px solid ${COLORS.hairline};color:${COLORS.muted};font-size:13px;">${esc(
            label,
          )}</td>
          <td align="right" style="padding:9px 0;border-bottom:1px solid ${COLORS.hairline};color:${COLORS.ink};font-size:14px;font-weight:600;">${esc(
            value,
          )}</td>
        </tr>`,
    )
    .join("");

  // ---- Add-ons ledger ----
  let addOnsHtml = "";
  if (selections.length > 0) {
    const rows = selections
      .map(
        (s) => `
        <tr>
          <td style="padding:7px 0;color:${COLORS.muted};font-size:13px;">${esc(
            selectionLabel(s.name, s.quantity),
          )}</td>
          <td align="right" style="padding:7px 0;color:${COLORS.ink};font-size:13px;">${inr(
            s.unitPrice * s.quantity,
          )}</td>
        </tr>`,
      )
      .join("");
    addOnsHtml = `
      <p style="margin:26px 0 6px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${COLORS.muted};">Add-ons</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows}</table>`;
  }

  const decorationsHtml = decorations
    ? `
      <p style="margin:24px 0 6px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${COLORS.muted};">Your note</p>
      <p style="margin:0;color:${COLORS.ink};font-size:14px;line-height:1.6;">${esc(
        decorations,
      )}</p>`
    : "";

  // ---- HTML ----
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.pageBg};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your booking at ${esc(
    screen.name,
  )} on ${esc(dateLong)} is confirmed.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.pageBg};padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${COLORS.card};border:1px solid ${COLORS.hairline};border-radius:14px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:24px 32px 0;">
              <span style="font-size:12px;letter-spacing:0.32em;text-transform:uppercase;color:${COLORS.accent};font-weight:700;">Let&rsquo;s Vibe</span>
            </td>
          </tr>
          <!-- Hero image -->
          <tr>
            <td style="padding:18px 32px 0;">
              <img src="${esc(
                image,
              )}" alt="${esc(screen.name)}" width="536" style="display:block;width:100%;height:200px;object-fit:cover;border-radius:10px;" />
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:26px 32px 32px;">
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${COLORS.accent};font-weight:700;">Booking confirmed</p>
              <h1 style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.15;color:${COLORS.ink};font-weight:600;">You&rsquo;re all set, ${esc(
                firstName,
              )}.</h1>
              <p style="margin:0 0 22px;color:${COLORS.muted};font-size:15px;line-height:1.6;">Your private screening at <strong style="color:${COLORS.ink};">${esc(
                screen.name,
              )}</strong> is locked in. Here are the details.</p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:1px solid ${COLORS.hairline};">
                ${detailRowsHtml}
              </table>

              ${addOnsHtml}
              ${decorationsHtml}

              <!-- Total -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:24px;border-top:2px solid ${COLORS.ink};">
                <tr>
                  <td style="padding:16px 0 0;color:${COLORS.muted};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;vertical-align:bottom;">Total</td>
                  <td align="right" style="padding:16px 0 0;color:${COLORS.ink};font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:600;">${inr(
                    booking.amount,
                  )}</td>
                </tr>
              </table>
              <p style="margin:6px 0 0;color:${COLORS.muted};font-size:12px;">${esc(
                paymentNote,
              )}</p>

              <!-- Booking id -->
              <p style="margin:22px 0 0;color:${COLORS.muted};font-size:12px;">Booking ID</p>
              <p style="margin:2px 0 0;color:${COLORS.ink};font-family:'Courier New',monospace;font-size:14px;">${esc(
                booking.id,
              )}</p>

              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
                <tr>
                  <td style="border-radius:999px;background:${COLORS.ink};">
                    <a href="${esc(
                      statusUrl,
                    )}" style="display:inline-block;padding:13px 26px;color:${COLORS.card};text-decoration:none;font-size:13px;letter-spacing:0.06em;font-weight:600;">View your booking &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid ${COLORS.hairline};">
              <p style="margin:0;color:${COLORS.muted};font-size:12px;line-height:1.6;">Let&rsquo;s Vibe &middot; Private cinema, Mumbai<br/>Questions or changes? Just reply to this email &mdash; it reaches us directly.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // ---- Plain text ----
  const textLines = [
    "BOOKING CONFIRMED",
    "",
    `You're all set, ${firstName}.`,
    `Your private screening at ${screen.name} is locked in.`,
    "",
    `Room:       ${screen.name}`,
    `Experience: ${experienceLabel}`,
    `Date:       ${dateLong}`,
    `Time:       ${timeRange}`,
    `Duration:   ${durationLabel}`,
    `Guests:     ${booking.guestCount}`,
  ];
  if (selections.length > 0) {
    textLines.push("", "Add-ons:");
    for (const s of selections) {
      textLines.push(
        `  - ${selectionLabel(s.name, s.quantity)}  ${inr(
          s.unitPrice * s.quantity,
        )}`,
      );
    }
  }
  if (decorations) {
    textLines.push("", `Your note: ${decorations}`);
  }
  textLines.push(
    "",
    `Total: ${inr(booking.amount)}`,
    paymentNote,
    "",
    `Booking ID: ${booking.id}`,
    `View your booking: ${statusUrl}`,
    "",
    "Let's Vibe · Private cinema, Mumbai",
    "Questions or changes? Just reply to this email.",
  );

  return { subject, html, text: textLines.join("\n") };
}
