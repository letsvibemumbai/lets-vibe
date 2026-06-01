import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { AddonItem, AddonPackage } from "@/types";

const ITEMS = "addonItems";
const PACKAGES = "addonPackages";

type WithId<T> = T & { id: string };

function fromDoc<T>(d: FirebaseFirestore.QueryDocumentSnapshot): WithId<T> {
  return { id: d.id, ...(d.data() as T) };
}

// ---------- items ----------

export async function listAddonItems(opts?: { activeOnly?: boolean }): Promise<AddonItem[]> {
  let q: FirebaseFirestore.Query = adminDb.collection(ITEMS).orderBy("sortOrder").orderBy("name");
  if (opts?.activeOnly) q = q.where("active", "==", true);
  const snap = await q.get();
  return snap.docs.map((d) => fromDoc<Omit<AddonItem, "id">>(d) as AddonItem);
}

export async function getAddonItem(id: string): Promise<AddonItem | null> {
  const snap = await adminDb.collection(ITEMS).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as Omit<AddonItem, "id">) };
}

export async function createAddonItem(
  data: Omit<AddonItem, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const ref = adminDb.collection(ITEMS).doc();
  await ref.set({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function updateAddonItem(
  id: string,
  data: Partial<Omit<AddonItem, "id" | "createdAt">>,
): Promise<void> {
  await adminDb
    .collection(ITEMS)
    .doc(id)
    .set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

export async function deleteAddonItem(id: string): Promise<void> {
  await adminDb.collection(ITEMS).doc(id).delete();
}

// ---------- packages ----------

export async function listAddonPackages(opts?: { activeOnly?: boolean }): Promise<AddonPackage[]> {
  let q: FirebaseFirestore.Query = adminDb.collection(PACKAGES).orderBy("sortOrder").orderBy("name");
  if (opts?.activeOnly) q = q.where("active", "==", true);
  const snap = await q.get();
  return snap.docs.map((d) => fromDoc<Omit<AddonPackage, "id">>(d) as AddonPackage);
}

export async function getAddonPackage(id: string): Promise<AddonPackage | null> {
  const snap = await adminDb.collection(PACKAGES).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as Omit<AddonPackage, "id">) };
}

export async function createAddonPackage(
  data: Omit<AddonPackage, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const ref = adminDb.collection(PACKAGES).doc();
  await ref.set({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function updateAddonPackage(
  id: string,
  data: Partial<Omit<AddonPackage, "id" | "createdAt">>,
): Promise<void> {
  await adminDb
    .collection(PACKAGES)
    .doc(id)
    .set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

export async function deleteAddonPackage(id: string): Promise<void> {
  await adminDb.collection(PACKAGES).doc(id).delete();
}
