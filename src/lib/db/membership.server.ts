import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { timestampToMillis } from "@/lib/db/bookings.server";
import type { Membership, MembershipConfig, MembershipStatus } from "@/types";

const SETTINGS = "settings";
const MEMBERSHIP_DOC = "membership";
const MEMBERS = "memberships";

/** Sensible defaults used until an admin saves config / on a fresh project. */
export const DEFAULT_MEMBERSHIP_CONFIG: MembershipConfig = {
  price: 100,
  discountPercent: 10,
  discountedBookings: 5,
  active: true,
  updatedAt: 0,
};

// ---------- config (settings/membership) ----------

export async function getMembershipConfig(): Promise<MembershipConfig> {
  const snap = await adminDb.collection(SETTINGS).doc(MEMBERSHIP_DOC).get();
  if (!snap.exists) return DEFAULT_MEMBERSHIP_CONFIG;
  return {
    ...DEFAULT_MEMBERSHIP_CONFIG,
    ...(snap.data() as Partial<MembershipConfig>),
    updatedAt: timestampToMillis(snap.data()?.updatedAt),
  };
}

export async function updateMembershipConfig(
  data: Partial<Omit<MembershipConfig, "updatedAt">>,
): Promise<void> {
  await adminDb
    .collection(SETTINGS)
    .doc(MEMBERSHIP_DOC)
    .set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

// ---------- memberships/{uid} ----------

function toMembership(uid: string, data: FirebaseFirestore.DocumentData): Membership {
  return {
    uid,
    email: data.email,
    name: data.name ?? undefined,
    status: data.status,
    remainingDiscountedBookings: data.remainingDiscountedBookings ?? 0,
    discountPercent: data.discountPercent ?? 0,
    price: data.price ?? 0,
    requestedAt: timestampToMillis(data.requestedAt),
    confirmedAt: data.confirmedAt ? timestampToMillis(data.confirmedAt) : undefined,
    createdAt: timestampToMillis(data.createdAt),
    updatedAt: timestampToMillis(data.updatedAt),
  };
}

export async function getMembership(uid: string): Promise<Membership | null> {
  const snap = await adminDb.collection(MEMBERS).doc(uid).get();
  if (!snap.exists) return null;
  return toMembership(snap.id, snap.data()!);
}

/**
 * Opt a signed-in user into the programme. Idempotent: if they already have a
 * pending or active membership, the existing status is returned unchanged.
 * Created as `pending` — an admin confirms it after collecting the fee.
 */
export async function requestMembership(input: {
  uid: string;
  email: string;
  name?: string;
}): Promise<MembershipStatus> {
  const config = await getMembershipConfig();
  if (!config.active) throw new Error("MEMBERSHIP_INACTIVE");

  const ref = adminDb.collection(MEMBERS).doc(input.uid);
  const existing = await ref.get();
  if (existing.exists) {
    const status = existing.data()?.status as MembershipStatus | undefined;
    if (status === "pending" || status === "active") return status;
  }

  await ref.set(
    {
      email: input.email,
      name: input.name ?? null,
      status: "pending",
      remainingDiscountedBookings: 0,
      discountPercent: config.discountPercent,
      price: config.price,
      requestedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  return "pending";
}

/** Admin confirms a pending membership — seeds the discounted-booking counter
 * from the CURRENT config so changes to the programme apply going forward. */
export async function confirmMembership(uid: string): Promise<void> {
  const config = await getMembershipConfig();
  await adminDb
    .collection(MEMBERS)
    .doc(uid)
    .set(
      {
        status: "active",
        remainingDiscountedBookings: config.discountedBookings,
        discountPercent: config.discountPercent,
        confirmedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

export async function revokeMembership(uid: string): Promise<void> {
  await adminDb
    .collection(MEMBERS)
    .doc(uid)
    .set(
      {
        status: "expired",
        remainingDiscountedBookings: 0,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

export async function listMemberships(status?: MembershipStatus): Promise<Membership[]> {
  let q: FirebaseFirestore.Query = adminDb.collection(MEMBERS);
  if (status) q = q.where("status", "==", status);
  const snap = await q.get();
  const rows = snap.docs.map((d) => toMembership(d.id, d.data()));
  rows.sort((a, b) => b.requestedAt - a.requestedAt);
  return rows;
}
