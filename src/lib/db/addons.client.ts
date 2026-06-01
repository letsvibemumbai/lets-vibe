import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { AddonItem, AddonPackage } from "@/types";

const ITEMS = "addonItems";
const PACKAGES = "addonPackages";

export async function listActiveAddonItems(): Promise<AddonItem[]> {
  const snap = await getDocs(
    query(collection(db, ITEMS), where("active", "==", true), orderBy("sortOrder"), orderBy("name")),
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AddonItem, "id">) }));
}

export async function getActiveAddonItem(id: string): Promise<AddonItem | null> {
  const snap = await getDoc(doc(db, ITEMS, id));
  if (!snap.exists()) return null;
  const data = snap.data() as Omit<AddonItem, "id">;
  if (!data.active) return null;
  return { id: snap.id, ...data };
}

export async function listActiveAddonPackages(): Promise<AddonPackage[]> {
  const snap = await getDocs(
    query(
      collection(db, PACKAGES),
      where("active", "==", true),
      orderBy("sortOrder"),
      orderBy("name"),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AddonPackage, "id">) }));
}
