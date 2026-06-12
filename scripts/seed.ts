import { config } from "dotenv";
import { resolve } from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { AddonItem, AddonPackage, Screen } from "../src/types";

config({ path: resolve(process.cwd(), ".env.local") });

function init() {
  if (getApps().length) return;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY in .env.local",
    );
  }
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

const SCREENS: Screen[] = [
  {
    id: "beach",
    name: "Beach Vibes",
    theme: "beach",
    description: "Sun, sand, and screen — a coastal-themed private theatre.",
    operatingStart: 9,
    operatingEnd: 21,
    basePrices: { "1h": 1500, "2h": 2500, "3h": 3500 },
    imageUrl: "",
  },
  {
    id: "grass",
    name: "Grass Garden",
    theme: "grass",
    description: "Open-air feel on lush grass — perfect for date nights.",
    operatingStart: 9,
    operatingEnd: 21,
    basePrices: { "1h": 1800, "2h": 2800, "3h": 3800 },
    imageUrl: "",
  },
  {
    id: "forest",
    name: "Forest Retreat",
    theme: "forest",
    description: "A canopy-immersed escape for groups who love a cozy hideaway.",
    operatingStart: 9,
    operatingEnd: 21,
    basePrices: { "1h": 2000, "2h": 3200, "3h": 4500 },
    imageUrl: "",
  },
];

// À la carte items — Movie-only extras, ₹400 each. Rose petals are offered in
// the forest room only ([] / absent screenIds ⇒ all screens).
const ADDON_ITEMS: Omit<AddonItem, "createdAt" | "updatedAt">[] = [
  { id: "cake", name: "Cake", price: 400, maxQuantity: 1, screenIds: [], active: true, sortOrder: 10 },
  { id: "balloons", name: "Balloons", price: 400, maxQuantity: 1, screenIds: [], active: true, sortOrder: 20 },
  { id: "lights", name: "Lights", price: 400, maxQuantity: 1, screenIds: [], active: true, sortOrder: 30 },
  { id: "fog", name: "Fog", price: 400, maxQuantity: 1, screenIds: [], active: true, sortOrder: 40 },
  { id: "rose-petals", name: "Rose petals", price: 400, maxQuantity: 1, screenIds: ["forest"], active: true, sortOrder: 50 },
];

// The Celebration experience — decorations included, priced per room (the
// forest override covers rose petals + the cozier setup).
const ADDON_PACKAGES: Omit<AddonPackage, "createdAt" | "updatedAt">[] = [
  {
    id: "celebration",
    name: "Celebration",
    description:
      "The full celebration setup — cake, balloons, lights, fog (and rose petals in the Forest room) — all included.",
    kind: "bundle",
    itemIds: ["cake", "balloons", "lights", "fog", "rose-petals"],
    includesAddons: true,
    featured: true,
    price: 1500,
    priceByScreen: { forest: 2000 },
    active: true,
    sortOrder: 10,
  },
];

async function main() {
  init();
  const db = getFirestore();
  const batch = db.batch();
  for (const screen of SCREENS) {
    const { id, ...rest } = screen;
    batch.set(db.collection("screens").doc(id), rest, { merge: true });
  }
  await batch.commit();
  console.log(`Seeded ${SCREENS.length} screens: ${SCREENS.map((s) => s.id).join(", ")}`);

  // Add-ons are CREATE-ONLY: docs that already exist are skipped so re-running
  // the seed never resets prices/flags the admin has tuned in /admin/addons.
  // (Screens above keep their merge-upsert.)
  const itemRefs = ADDON_ITEMS.map((i) => db.collection("addonItems").doc(i.id));
  const packageRefs = ADDON_PACKAGES.map((p) => db.collection("addonPackages").doc(p.id));
  const snaps = await db.getAll(...itemRefs, ...packageRefs);
  const existing = new Set(snaps.filter((s) => s.exists).map((s) => s.ref.path));

  const now = Date.now();
  const addonBatch = db.batch();
  const skipped: string[] = [];
  let createdItems = 0;
  let createdPackages = 0;
  ADDON_ITEMS.forEach((item, i) => {
    if (existing.has(itemRefs[i].path)) {
      skipped.push(item.id);
      return;
    }
    const { id: _id, ...rest } = item;
    void _id;
    addonBatch.set(itemRefs[i], { ...rest, createdAt: now, updatedAt: now });
    createdItems += 1;
  });
  ADDON_PACKAGES.forEach((pkg, i) => {
    if (existing.has(packageRefs[i].path)) {
      skipped.push(pkg.id);
      return;
    }
    const { id: _id, ...rest } = pkg;
    void _id;
    addonBatch.set(packageRefs[i], { ...rest, createdAt: now, updatedAt: now });
    createdPackages += 1;
  });
  if (createdItems + createdPackages > 0) await addonBatch.commit();
  console.log(
    `Seeded ${createdItems} add-on items, ${createdPackages} packages` +
      (skipped.length ? ` (skipped existing: ${skipped.join(", ")})` : ""),
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
