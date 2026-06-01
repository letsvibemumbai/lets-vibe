import { chromium } from "playwright";
import { mkdirSync, rmSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3010";
const OUT = "screenshots";
try { rmSync(OUT, { recursive: true, force: true }); } catch {}
mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });

  console.log("→ landing");
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await shot("L1-hero");

  for (const [name, y] of [
    ["L2-screens", 900],
    ["L3-romantic-addon", 1700],
    ["L4-romantic-fullbleed", 2700],
    ["L5-packages", 3800],
    ["L6-polaroids", 5000],
    ["L7-reviews", 6200],
    ["L8-faq", 7300],
    ["L9-final-cta", 8800],
  ]) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
    await page.waitForTimeout(900);
    await shot(name);
  }

  console.log("→ /book step 1");
  await page.goto(`${BASE}/book`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await shot("B1-step1");

  console.log("→ /book/beach step 2");
  await page.goto(`${BASE}/book/beach`, { waitUntil: "domcontentloaded" });
  await page.locator('[role="tabpanel"][data-state="active"] a').filter({ hasText: /\d+[–-]\d+/ }).first().waitFor({ timeout: 60000 });
  await page.waitForTimeout(500);
  await shot("B2-step2-slots");

  const slot = page.locator('[role="tabpanel"][data-state="active"] a').filter({ hasText: /\d+[–-]\d+/ }).first();
  const label = (await slot.textContent())?.trim();
  console.log(">>> click slot", label);
  await slot.click();
  await page.waitForURL(/\/details$/, { timeout: 30000 });
  await page.waitForTimeout(2000);
  console.log("URL:", page.url());
  await shot("B3-step3-details");

  console.log("OK");
  await browser.close();
})().catch((e) => {
  console.error("FATAL", e.message);
  process.exit(1);
});
