import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { timestampToMillis } from "@/lib/db/bookings.server";
import type { Influencer } from "@/types";

const COLLECTION = "influencers";

type NewInfluencer = Omit<Influencer, "id" | "createdAt" | "updatedAt">;

function toInfluencer(id: string, data: FirebaseFirestore.DocumentData): Influencer {
  // Normalize the Firestore Timestamps so influencers are plain serializable
  // objects (safe to pass to client components).
  return {
    ...(data as Omit<Influencer, "id">),
    id,
    createdAt: timestampToMillis(data.createdAt),
    updatedAt: timestampToMillis(data.updatedAt),
  } as Influencer;
}

/** Drop undefined fields so Firestore never sees an `undefined` value. */
function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out as Partial<T>;
}

export async function getInfluencer(id: string): Promise<Influencer | null> {
  const snap = await adminDb.collection(COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return toInfluencer(snap.id, snap.data()!);
}

export async function listInfluencers(): Promise<Influencer[]> {
  // Index-free: fetch all and sort in memory by date of shoot (newest first).
  const snap = await adminDb.collection(COLLECTION).get();
  const rows = snap.docs.map((d) => toInfluencer(d.id, d.data()));
  rows.sort((a, b) => b.dateOfShoot.localeCompare(a.dateOfShoot));
  return rows;
}

export async function createInfluencer(data: NewInfluencer): Promise<string> {
  const ref = await adminDb.collection(COLLECTION).add({
    ...stripUndefined(data as Record<string, unknown>),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function updateInfluencer(
  id: string,
  data: Partial<Omit<Influencer, "id" | "createdAt">>,
): Promise<void> {
  await adminDb
    .collection(COLLECTION)
    .doc(id)
    .set(
      {
        ...stripUndefined(data as Record<string, unknown>),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

export async function deleteInfluencer(id: string): Promise<void> {
  await adminDb.collection(COLLECTION).doc(id).delete();
}
