// Playwright smoke + cursor-perf check for the public site.
// Usage: start the app (`npm run dev` or `npm start`), then `npm run smoke`.
// Part A crawls the public pages and reports real console/page errors + failed
// requests (GA beacons and aborted RSC/HMR fetches are expected noise).
// Part B measures the custom cursor's lag vs the pointer + frame jank (idle +
// moving) — lagAvgPx should stay near 0.
import { chromium } from "playwright";

const BASE = process.env.SMOKE_URL || "http://localhost:3000";
const out = { pipeline: [], cursor: {} };

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1366, height: 900 },
  reducedMotion: "no-preference",
});
const page = await ctx.newPage();

const consoleErrors = [];
const pageErrors = [];
const failedReq = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text().slice(0, 300));
});
page.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 300)));
page.on("requestfailed", (r) => {
  const u = r.url();
  if (u.startsWith("data:")) return;
  failedReq.push(`${r.method()} ${u.slice(0, 120)} :: ${r.failure()?.errorText}`);
});
page.on("response", (r) => {
  if (r.status() >= 400) failedReq.push(`HTTP ${r.status()} ${r.url().slice(0, 120)}`);
});

async function visit(path) {
  const b = { c: consoleErrors.length, p: pageErrors.length, f: failedReq.length };
  let status;
  try {
    const resp = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 35000 });
    status = resp ? resp.status() : "no-response";
  } catch (e) {
    status = "NAV-ERROR: " + e.message.slice(0, 120);
  }
  await page.waitForTimeout(700);
  out.pipeline.push({
    path,
    status,
    consoleErrors: consoleErrors.slice(b.c),
    pageErrors: pageErrors.slice(b.p),
    failedReq: failedReq.slice(b.f),
  });
}

// ---- Part A: pipeline crawl ----
for (const p of ["/", "/book", "/book/beach", "/screens/beach", "/faq", "/contact", "/terms", "/account"]) {
  await visit(p);
}

// ---- Part B: cursor perf probe on homepage ----
await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 35000 });
await page.waitForTimeout(1200);
await page.mouse.move(120, 120);
await page.waitForTimeout(150);

await page.evaluate(() => {
  const P = (window.__p = {
    idle: [],
    moveFrames: [],
    lag: [],
    longtasks: [],
    last: { x: 0, y: 0 },
    phase: "idle",
  });
  window.addEventListener("mousemove", (e) => { P.last = { x: e.clientX, y: e.clientY }; }, { passive: true });
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) P.longtasks.push(+e.duration.toFixed(1)); })
      .observe({ entryTypes: ["longtask"] });
  } catch {}
  // find the custom-cursor dot wrapper: lowest z-index (>=80) fixed pointer-events:none div
  let dot = null, dz = 1e9;
  for (const el of document.querySelectorAll("div")) {
    const s = getComputedStyle(el);
    if (s.position === "fixed" && s.pointerEvents === "none") {
      const z = parseInt(s.zIndex) || 0;
      if (z >= 80 && z < dz) { dz = z; dot = el; }
    }
  }
  window.__dot = dot;
  let last = performance.now();
  const tick = (t) => {
    const dt = t - last; last = t;
    if (P.phase === "idle") P.idle.push(dt);
    else if (P.phase === "move") {
      P.moveFrames.push(dt);
      if (window.__dot) {
        const r = window.__dot.getBoundingClientRect();
        P.lag.push(Math.hypot(r.left + r.width / 2 - P.last.x, r.top + r.height / 2 - P.last.y));
      }
    }
    if (P.phase !== "done") requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

// idle phase ~1.2s (marquees/ticker running, no mouse movement)
await page.waitForTimeout(1200);
await page.evaluate(() => { window.__p.phase = "move"; });

// movement phase: sweep the viewport ~1.5s, ~1 move/frame
const W = 1366, H = 900;
const steps = 90;
for (let i = 0; i <= steps; i++) {
  const x = 120 + (W - 240) * (i / steps);
  const y = H / 2 + Math.sin(i / 7) * 280;
  await page.mouse.move(x, y);
  await page.waitForTimeout(16);
}
await page.waitForTimeout(250);

out.cursor = await page.evaluate(() => {
  const P = window.__p;
  P.phase = "done";
  const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const mx = (a) => (a.length ? Math.max(...a) : 0);
  const idle = P.idle.slice(3);
  const move = P.moveFrames.slice(3);
  const lag = P.lag.slice(3);
  return {
    foundCursorEl: !!window.__dot,
    idle: {
      frameAvgMs: +avg(idle).toFixed(1),
      frameMaxMs: +mx(idle).toFixed(1),
      jank24: idle.filter((d) => d > 24).length,
      frames: idle.length,
    },
    moving: {
      frameAvgMs: +avg(move).toFixed(1),
      frameMaxMs: +mx(move).toFixed(1),
      jank24: move.filter((d) => d > 24).length,
      jank50: move.filter((d) => d > 50).length,
      frames: move.length,
      lagAvgPx: +avg(lag).toFixed(1),
      lagMaxPx: +mx(lag).toFixed(1),
    },
    longTaskCount: P.longtasks.length,
    longTaskMaxMs: +mx(P.longtasks).toFixed(1),
    longTaskTotalMs: +P.longtasks.reduce((x, y) => x + y, 0).toFixed(1),
  };
});

console.log(JSON.stringify(out, null, 2));
await browser.close();
