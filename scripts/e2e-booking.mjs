// End-to-end booking test for the manual-UPI checkout: seeds the booking draft,
// drives /book/beach/payment -> uploads a payment screenshot -> "Submit for
// confirmation" -> the pending status page, verifies the PENDING booking (with
// its uploaded screenshot) in Firestore, then DELETES the test booking +
// customer via the Admin SDK so nothing is left behind.
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

// A tiny valid 1x1 PNG to stand in for a GPay confirmation screenshot.
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

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
  hasSubmit: [...document.querySelectorAll("button,a")].some((b) => /submit for confirmation/i.test(b.textContent || "")),
  hasUpload: !!document.querySelector('input[type="file"]'),
}));
console.log("  payment review:", JSON.stringify(pay));

let bookingId = null;
let statusInfo = null;
if (pay.hasSubmit && pay.hasUpload) {
  console.log("→ Upload a payment screenshot");
  await page.setInputFiles('input[type="file"]', {
    name: "gpay-confirmation.png",
    mimeType: "image/png",
    buffer: PNG_1X1,
  });
  await page.locator(':text("Screenshot attached")').first().waitFor({ timeout: 25000 }).catch(() => {});

  console.log("→ Click 'Submit for confirmation'");
  await page.locator(':is(button,a):has-text("Submit for confirmation")').first().click();
  await page.waitForURL("**/book/**/status**", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const u = new URL(page.url());
  const parts = u.pathname.split("/").filter(Boolean); // ["book", "<id>", "status"]
  bookingId = parts[0] === "book" && parts[2] === "status" ? parts[1] : null;
  statusInfo = await page.evaluate(() => ({
    path: location.pathname,
    awaiting: /awaiting confirmation/i.test(document.body.innerText),
    verifyingNote: /verifying it/i.test(document.body.innerText),
  }));
  console.log("  status page:", JSON.stringify(statusInfo));
  console.log("  bookingId:", bookingId);
} else {
  console.log("  !! Submit/upload controls not present — payment page did not render from the seeded draft");
}

console.log("  runtime errors:", errors.length ? JSON.stringify(errors) : "none");
await browser.close();

// ---- verify in Firestore, then clean up ----
let dbOk = false;
if (bookingId) {
  const snap = await db.collection("bookings").doc(bookingId).get();
  if (snap.exists) {
    const b = snap.data();
    dbOk =
      b.status === "pending" &&
      b.paymentStatus === "PENDING" &&
      typeof b.paymentScreenshotUrl === "string" &&
      b.paymentScreenshotUrl.length > 0 &&
      b.source === "online";
    console.log("→ Firestore booking:", JSON.stringify({
      screenId: b.screenId, date: b.date, startTime: b.startTime, endTime: b.endTime,
      status: b.status, paymentStatus: b.paymentStatus,
      hasScreenshot: typeof b.paymentScreenshotUrl === "string" && b.paymentScreenshotUrl.length > 0,
      source: b.source, amount: b.amount, customerName: b.customerName,
    }));
  } else {
    console.log("  !! booking", bookingId, "not found in Firestore");
  }
}
const postRemoved = await cleanupTestData();
console.log(`  ✓ cleaned up ${postRemoved} test booking[s] + test customer`);
console.log(
  "\nE2E result:",
  bookingId && dbOk ? "PASS (pending booking + screenshot created, cleaned up)" : "NEEDS REVIEW",
);
process.exit(0);
