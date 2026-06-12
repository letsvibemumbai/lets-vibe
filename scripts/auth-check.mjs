// Verifies the customer Google sign-in: renders the auth gate, clicks
// "Continue with Google", and inspects the OAuth popup to confirm it reaches
// Google's real sign-in (vs a provider/redirect config error).
// Usage: app running, then `node scripts/auth-check.mjs`.
import { chromium } from "playwright";

const BASE = process.env.SMOKE_URL || "http://localhost:3000";
const draft = { state: { screenId: "beach", date: "2027-12-20", duration: 2, startTime: "14:00", endTime: "16:00", addOns: {}, amount: 2500 }, version: 0 };

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ reducedMotion: "reduce" });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 180)); });
page.on("pageerror", (e) => errors.push("PAGEERR: " + String(e).slice(0, 150)));
await page.addInitScript((d) => { try { sessionStorage.setItem("letsvibe.booking", d); } catch {} }, JSON.stringify(draft));

console.log("→ Open /book/beach/auth (with seeded draft)");
await page.goto(BASE + "/book/beach/auth", { waitUntil: "domcontentloaded", timeout: 35000 });
// Wait for the gate to settle: Firebase auth resolves (loading→false), then the
// "Continue with Google" button renders.
await page
  .locator('button:has-text("Continue with Google")')
  .waitFor({ state: "visible", timeout: 25000 })
  .catch(() => {});
const gate = await page.evaluate(() => ({
  path: location.pathname,
  hasGoogleBtn: [...document.querySelectorAll("button")].some((b) => /continue with google/i.test(b.textContent || "")),
}));
console.log("  auth gate:", JSON.stringify(gate));

if (gate.hasGoogleBtn) {
  console.log("→ Click 'Continue with Google' and inspect the OAuth popup");
  const [popup] = await Promise.all([
    page.waitForEvent("popup", { timeout: 15000 }).catch(() => null),
    page.click('button:has-text("Continue with Google")'),
  ]);
  if (!popup) {
    console.log("  !! No popup opened (provider may be disabled — check toast below)");
  } else {
    await popup.waitForLoadState("domcontentloaded", { timeout: 20000 }).catch(() => {});
    await popup.waitForTimeout(4000);
    const info = await popup.evaluate(() => ({
      host: location.host,
      url: location.href,
      title: document.title,
      body: (document.body?.innerText || "").replace(/\s+/g, " ").slice(0, 260),
    })).catch((e) => ({ host: "(closed)", url: "", title: "", body: String(e).slice(0, 120) }));
    const u = new URL(info.url || "http://x");
    console.log("  popup host:", info.host);
    console.log("  oauth client_id:", u.searchParams.get("client_id") || "(n/a)");
    console.log("  oauth redirect_uri:", u.searchParams.get("redirect_uri") || "(n/a)");
    console.log("  popup title:", info.title);
    console.log("  popup body:", info.body);
    const reachedGoogle = /google\.com$/.test(info.host) || info.host.includes("accounts.google");
    const errorish = /error 400|redirect_uri_mismatch|access blocked|invalid|disabled|not been verified/i.test(info.body);
    console.log("  >>> verdict:", reachedGoogle && !errorish ? "REACHED GOOGLE SIGN-IN (config OK)" : reachedGoogle ? "reached Google but shows an error/notice — read body" : "did NOT reach Google — read body/toast");

    // COOP check: closing the popup should reset the "Opening Google" spinner.
    await popup.close().catch(() => {});
    await page.waitForTimeout(3000);
    const afterClose = await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) => /continue with google|opening google/i.test(b.textContent || ""));
      return btn ? btn.textContent.replace(/\s+/g, " ").trim() : "(button gone)";
    });
    console.log("  after closing popup, button:", JSON.stringify(afterClose), /opening/i.test(afterClose) ? ">>> STUCK (close not detected)" : ">>> reset OK (close detected)");
  }
  await page.waitForTimeout(800);
  const toast = await page.evaluate(() => { const t = document.querySelector("[data-sonner-toast]"); return t ? t.textContent : null; });
  console.log("  main-page toast:", toast);
}
console.log("  console/page errors:", errors.length ? JSON.stringify(errors) : "none");
await browser.close();
