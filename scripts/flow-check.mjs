// Drives the public booking flow with Playwright to find runtime breakage.
// Usage: app running, then `node scripts/flow-check.mjs`.
import { chromium } from "playwright";

const BASE = process.env.SMOKE_URL || "http://localhost:3000";
const log = (...a) => console.log(...a);

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, reducedMotion: "reduce" });
const page = await ctx.newPage();

const consoleErrors = [];
const pageErrors = [];
const navs = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200)); });
page.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 200)));
page.on("framenavigated", (f) => { if (f === page.mainFrame()) navs.push(new URL(f.url()).pathname); });

const popups = [];
ctx.on("page", (p) => popups.push(p.url()));

function step(n, msg) { log(`\n[${n}] ${msg}`); }

try {
  // 1) room picker
  step(1, "Open /book");
  await page.goto(BASE + "/book", { waitUntil: "networkidle", timeout: 35000 });
  const cards = await page.$$eval('a[href^="/book/"]', (els) =>
    els.map((e) => e.getAttribute("href")).filter((h) => /^\/book\/(beach|grass|forest)$/.test(h)),
  );
  log("   room cards:", [...new Set(cards)]);

  // 2) pick Beach
  step(2, "Click Beach room");
  await Promise.all([
    page.waitForURL("**/book/beach", { timeout: 20000 }),
    page.click('a[href="/book/beach"]'),
  ]);
  log("   url:", new URL(page.url()).pathname);

  // 3) wait for slots
  step(3, "Wait for date/slot picker to load slots");
  await page.waitForTimeout(2500);
  const slotInfo = await page.evaluate(() => {
    const slotLinks = [...document.querySelectorAll('a[href$="/auth"]')].map((a) => a.textContent.trim());
    const noSlots = document.body.innerText.includes("No slots for this option");
    const heading = document.querySelector("h1")?.textContent?.trim();
    const durationShown = document.querySelector("span.text-5xl")?.textContent?.trim();
    return { slotCount: slotLinks.length, firstSlots: slotLinks.slice(0, 4), noSlots, heading, durationShown };
  });
  log("   ", JSON.stringify(slotInfo));

  // 4) pick a slot -> should go to /auth
  if (slotInfo.slotCount > 0) {
    step(4, "Click first available slot (diagnostic, no waitForURL)");
    navs.length = 0;
    await page.locator('a[href$="/book/beach/auth"]').first().click();
    await page.waitForTimeout(4000);
    log("   nav sequence after click:", navs.join("  ->  ") || "(none)");
    log("   final url:", new URL(page.url()).pathname);

    // confirm the draft persisted to sessionStorage
    const draft = await page.evaluate(() => {
      try { return JSON.parse(sessionStorage.getItem("letsvibe.booking") || "{}"); } catch { return null; }
    });
    log("   persisted draft.state:", JSON.stringify(draft?.state ?? draft));

    // 5) auth gate present?
    step(5, "Auth gate renders?");
    await page.waitForTimeout(1500);
    const hasGoogle = await page.evaluate(() =>
      [...document.querySelectorAll("button")].some((b) => /continue with google/i.test(b.textContent || "")),
    );
    log("   'Continue with Google' button:", hasGoogle);

    // 6) try clicking it — does Google auth even fire, or error?
    if (hasGoogle) {
      step(6, "Click 'Continue with Google' (detect popup vs error)");
      const btn = await page.$('button:has-text("Continue with Google")');
      await btn?.click().catch(() => {});
      await page.waitForTimeout(4000);
      const toast = await page.evaluate(() => {
        const el = document.querySelector("[data-sonner-toast]");
        return el ? el.textContent : null;
      });
      log("   popups opened:", popups);
      log("   toast/error:", toast);
    }
  } else {
    step(4, "NO SLOTS — trying a date 10 days out via the calendar");
    // click the duration to 1h to maximize availability, then look again
    log("   (no slots on default date/duration)");
  }
} catch (e) {
  log("\nFLOW ERROR:", e.message);
}

log("\n=== consoleErrors ===", JSON.stringify(consoleErrors, null, 2));
log("=== pageErrors ===", JSON.stringify(pageErrors, null, 2));
await browser.close();
