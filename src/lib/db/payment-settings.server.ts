import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { timestampToMillis } from "@/lib/db/bookings.server";
import type { PaymentSettings } from "@/types";

const SETTINGS = "settings";
const PAYMENT_DOC = "payment";

/** Empty config used until an admin uploads a QR / on a fresh project. */
export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  upiQrUrl: undefined,
  upiId: undefined,
  payeeName: undefined,
  instructions: undefined,
  updatedAt: 0,
};

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const snap = await adminDb.collection(SETTINGS).doc(PAYMENT_DOC).get();
  if (!snap.exists) return DEFAULT_PAYMENT_SETTINGS;
  const data = snap.data() as Partial<PaymentSettings>;
  return {
    ...DEFAULT_PAYMENT_SETTINGS,
    ...data,
    updatedAt: timestampToMillis(snap.data()?.updatedAt),
  };
}

export async function updatePaymentSettings(
  data: Partial<Omit<PaymentSettings, "updatedAt">>,
): Promise<void> {
  await adminDb
    .collection(SETTINGS)
    .doc(PAYMENT_DOC)
    .set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}
