"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { adminDb } from "@/lib/firebase/admin";
import {
  createInfluencer,
  deleteInfluencer,
  getInfluencer,
  updateInfluencer,
} from "@/lib/db/influencers.server";

const IdSchema = z.string().min(1);

const InfluencerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  amount: z.number().int().min(0),
  dateOfShoot: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  igHandle: z.string().trim().min(1).max(60),
  reelLink: z
    .string()
    .url()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  paymentMethod: z.enum(["cash", "upi", "card", "bank"]),
  performance: z.enum(["excellent", "good", "bad", "pending"]),
  notes: z
    .string()
    .max(500)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type InfluencerPayload = z.infer<typeof InfluencerSchema>;

function revalidate() {
  revalidatePath("/admin/influencers");
  revalidatePath("/admin/accounting");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/expenses");
  revalidatePath("/admin");
}

/** Normalize an Instagram handle to always carry a single leading `@`. */
function withAt(handle: string): string {
  const trimmed = handle.trim().replace(/^@+/, "");
  return `@${trimmed}`;
}

/**
 * Mirror the influencer spend into a linked marketing expense at a fixed doc id
 * (`inf-exp-{influencerId}`) so it appears in accounting exactly once and stays
 * in sync when the influencer is edited. Uses a deterministic doc id, so we
 * write to the expenses collection directly instead of createExpense (which
 * auto-generates ids).
 */
async function upsertInfluencerExpense(
  influencerId: string,
  data: InfluencerPayload,
): Promise<void> {
  const ref = adminDb.collection("expenses").doc(`inf-exp-${influencerId}`);
  const base = {
    date: data.dateOfShoot,
    category: "marketing" as const,
    description: `Influencer: ${data.name} (${withAt(data.igHandle)})`,
    amount: data.amount,
    paymentMethod: data.paymentMethod,
    influencerId,
  };
  // Only stamp createdAt on first create — merging serverTimestamp on every
  // edit would clobber the linked expense's original creation date.
  const snap = await ref.get();
  if (snap.exists) {
    await ref.set(base, { merge: true });
  } else {
    await ref.set({ ...base, createdAt: FieldValue.serverTimestamp() });
  }
}

export async function createInfluencerAction(
  raw: InfluencerPayload,
): Promise<string> {
  await requireAdmin();
  const data = InfluencerSchema.parse(raw);
  const id = await createInfluencer({
    name: data.name,
    amount: data.amount,
    dateOfShoot: data.dateOfShoot,
    igHandle: data.igHandle,
    reelLink: data.reelLink,
    paymentMethod: data.paymentMethod,
    performance: data.performance,
    notes: data.notes,
  });
  await upsertInfluencerExpense(id, data);
  revalidate();
  return id;
}

export async function updateInfluencerAction(
  rawId: string,
  raw: InfluencerPayload,
): Promise<void> {
  await requireAdmin();
  const id = IdSchema.parse(rawId);
  const data = InfluencerSchema.parse(raw);
  const existing = await getInfluencer(id);
  if (!existing) throw new Error("Influencer not found");
  await updateInfluencer(id, {
    name: data.name,
    amount: data.amount,
    dateOfShoot: data.dateOfShoot,
    igHandle: data.igHandle,
    reelLink: data.reelLink,
    paymentMethod: data.paymentMethod,
    performance: data.performance,
    notes: data.notes,
  });
  await upsertInfluencerExpense(id, data);
  revalidate();
}

export async function deleteInfluencerAction(rawId: string): Promise<void> {
  await requireAdmin();
  const id = IdSchema.parse(rawId);
  await deleteInfluencer(id);
  await adminDb.collection("expenses").doc(`inf-exp-${id}`).delete();
  revalidate();
}
