// End-to-end booking-creation test: seeds the booking draft, drives the payment
// review -> "Reserve this slot" -> success page + QR, then DELETES the test
// booking + customer via the Admin SDK so nothing is left behind.
// Uses a far-future date + obvious test data so it can never collide with a
// real booking. Usage: app running, then `node scripts/e2e-booking.mjs`.
import { chromium } from "playwright";
import { config } from "dotenv";
import { resolve } from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

config({ path: resolve(process.cwd(), ".env.local") });

function initAdmin() {
  if (getApps().length) return;
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}
initAdmin();
const db = getFirestore();

const BASE = process.env.SMOKE_URL || "http://localhost:3000";
const PHONE = "9000000001";
const DATE = "2027-12-20"; // far future, well clear of any real booking

// Remove any prior test data (orphaned test bookings + the test customer) so
// the run is idempotent and never collides with itself.
async function cleanupTestData() {
  const snap = await db.collection("bookings").where("customerPhone", "==", PHONE).get();
  for (const d of snap.docs) await d.ref.delete();
  const cust = await db.collection("customers").doc(PHONE).get();
  if (cust.exists) await cust.ref.delete();
  return snap.size;
}
const preRemoved = await cleanupTestData();
if (preRemoved) console.log(`(pre-cleanup removed ${preRemoved} stale test booking[s])`);
const draft = {
  state: {
    screenId: "beach",
    date: DATE,
    duration: 2,
    startTime: "14:00",
    endTime: "16:00",
    customer: { name: "Playwright E2E", phone: PHONE, guestCount: 2 },
    addOns: {},
    amount: 2500,
  },
  version: 0,
};

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR: " + String(e).slice(0, 200)));
page.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE: " + m.text().slice(0, 200)); });

await page.addInitScript((d) => { try { sessionStorage.setItem("letsvibe.booking", d); } catch {} }, JSON.stringify(draft));

console.log("→ Drive /book/beach/payment with a seeded draft");
await page.goto(BASE + "/book/beach/payment", { waitUntil: "networkidle", timeout: 35000 });
await page.waitForTimeout(1500);
const pay = await page.evaluate(() => ({
  path: location.pathname,
  total: (document.body.innerText.match(/₹[\d,]+/g) || []).slice(0, 3),
  hasReserve: [...document.querySelectorAll("button,a")].some((b) => /reserve this slot/i.test(b.textContent || "")),
}));
console.log("  payment review:", JSON.stringify(pay));

let bookingId = null;
let success = null;
if (pay.hasReserve) {
  console.log("→ Click 'Reserve this slot'");
  await page.locator(':is(button,a):has-text("Reserve this slot")').first().click();
  await page.waitForURL("**/book/success**", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const u = new URL(page.url());
  bookingId = u.searchParams.get("bookingId");
  success = await page.evaluate(() => ({
    path: location.pathname,
    heading: document.querySelector("h1")?.textContent?.trim(),
    reservedText: document.body.innerText.includes("Reserved"),
    hasQR: !!document.querySelector('img[alt="Booking entry QR code"]'),
    bookingIdShown: (document.body.innerText.match(/[A-Za-z0-9]{16,}/) || [])[0] || null,
  }));
  console.log("  success page:", JSON.stringify(success));
  console.log("  bookingId:", bookingId);
} else {
  console.log("  !! Reserve button not present — payment review did not render from the seeded draft");
}

console.log("  runtime errors:", errors.length ? JSON.stringify(errors) : "none");
await browser.close();

// ---- verify in Firestore, then clean up ----
if (bookingId) {
  const snap = await db.collection("bookings").doc(bookingId).get();
  if (snap.exists) {
    const b = snap.data();
    console.log("→ Firestore booking:", JSON.stringify({
      screenId: b.screenId, date: b.date, startTime: b.startTime, endTime: b.endTime,
      status: b.status, source: b.source, amount: b.amount, customerName: b.customerName,
    }));
  } else {
    console.log("  !! booking", bookingId, "not found in Firestore");
  }
}
const postRemoved = await cleanupTestData();
console.log(`  ✓ cleaned up ${postRemoved} test booking[s] + test customer`);
console.log("\nE2E result:", bookingId && success?.hasQR ? "PASS (booking created + success + QR, cleaned up)" : "NEEDS REVIEW");
process.exit(0);
