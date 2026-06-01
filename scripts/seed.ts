import { config } from "dotenv";
import { resolve } from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { Screen } from "../src/types";

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
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
