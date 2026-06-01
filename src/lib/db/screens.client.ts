import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Screen, ScreenId } from "@/types";

const COLLECTION = "screens";

export async function getScreens(): Promise<Screen[]> {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy("name")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Screen);
}

export async function getScreen(id: ScreenId): Promise<Screen | null> {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Screen;
}
