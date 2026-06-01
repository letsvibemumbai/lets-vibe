import "server-only";
import { adminDb } from "@/lib/firebase/admin";
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

export async function updateScreen(
  id: ScreenId,
  data: Partial<Omit<Screen, "id">>,
): Promise<void> {
  await adminDb.collection(COLLECTION).doc(id).set(data, { merge: true });
}
