import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { SCREEN_IDS, SCREEN_PRESETS } from "@/lib/booking/constants";
import type { Screen, ScreenId } from "@/types";

const COLLECTION = "screens";

export async function getScreens(): Promise<Screen[]> {
  const snap = await adminDb.collection(COLLECTION).orderBy("name").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Screen);
}

export async function getScreen(id: ScreenId): Promise<Screen | null> {
  const snap = await adminDb.collection(COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as Screen;
}

/**
 * Firestore screen, falling back to the built-in preset when the doc is missing
 * (fresh project, pre-seed). Always returns a Screen for a valid id, so the
 * customer booking funnel can rely on Firestore being the source of truth
 * without crashing on an unseeded project.
 */
export async function getScreenResolved(id: ScreenId): Promise<Screen> {
  return (await getScreen(id)) ?? SCREEN_PRESETS[id];
}

/**
 * All screens in canonical order (beach, grass, forest), each resolved against
 * Firestore with preset fallback. Powers the booking room picker and the
 * homepage so admin edits (name, price, image) show up everywhere.
 */
export async function getScreensResolved(): Promise<Screen[]> {
  const docs = await getScreens();
  const byId = new Map(docs.map((s) => [s.id, s] as const));
  return SCREEN_IDS.map((id) => byId.get(id) ?? SCREEN_PRESETS[id]);
}

export async function updateScreen(
  id: ScreenId,
  data: Partial<Omit<Screen, "id">>,
): Promise<void> {
  await adminDb.collection(COLLECTION).doc(id).set(data, { merge: true });
}
