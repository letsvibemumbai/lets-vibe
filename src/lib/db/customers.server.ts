import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { timestampToMillis } from "@/lib/db/bookings.server";
import type { BookingSource, Customer } from "@/types";

const CUSTOMERS = "customers";

export function customerDocRef(phone: string): FirebaseFirestore.DocumentReference {
  return adminDb.collection(CUSTOMERS).doc(phone);
}

function toCustomer(id: string, data: FirebaseFirestore.DocumentData): Customer {
  return {
    id,
    phone: data.phone,
    name: data.name ?? "",
    email: data.email ?? undefined,
    totalBookings: data.totalBookings ?? 0,
    firstBookingDate: data.firstBookingDate ?? undefined,
    lastBookingDate: data.lastBookingDate ?? undefined,
    lastSource: data.lastSource ?? undefined,
    createdAt: timestampToMillis(data.createdAt),
    updatedAt: timestampToMillis(data.updatedAt),
  };
}

/**
 * Create-or-link a customer inside a booking transaction. The caller must have
 * ALREADY read `customerSnap` (Firestore requires all reads before writes).
 * First sighting → creates the account; repeat phone → links + increments.
 * Returns the customerId (the phone) to stamp on the booking.
 */
export function writeCustomerUpsert(
  tx: FirebaseFirestore.Transaction,
  customerSnap: FirebaseFirestore.DocumentSnapshot,
  input: {
    phone: string;
    name: string;
    email?: string | null;
    date: string;
    source: BookingSource;
  },
): string {
  const ref = customerSnap.ref;
  if (customerSnap.exists) {
    const cur = customerSnap.data() ?? {};
    tx.update(ref, {
      // Keep the latest non-empty name; never wipe a known name.
      name: input.name || cur.name || "",
      email: input.email ?? cur.email ?? null,
      totalBookings: FieldValue.increment(1),
      lastBookingDate: input.date,
      lastSource: input.source,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    tx.set(ref, {
      phone: input.phone,
      name: input.name,
      email: input.email ?? null,
      totalBookings: 1,
      firstBookingDate: input.date,
      lastBookingDate: input.date,
      lastSource: input.source,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  return input.phone;
}

export async function getCustomerByPhone(phone: string): Promise<Customer | null> {
  const snap = await customerDocRef(phone).get();
  if (!snap.exists) return null;
  return toCustomer(snap.id, snap.data()!);
}

/** All customers, newest activity first. Index-free (sorted in memory). */
export async function listCustomers(): Promise<Customer[]> {
  const snap = await adminDb.collection(CUSTOMERS).get();
  const rows = snap.docs.map((d) => toCustomer(d.id, d.data()));
  rows.sort((a, b) =>
    (b.lastBookingDate ?? "").localeCompare(a.lastBookingDate ?? ""),
  );
  return rows;
}

/**
 * Customers with `totalBookings` + `lastBookingDate` derived LIVE from the
 * bookings collection, counting only active (non-cancelled) bookings by phone.
 * This is the source of truth for the admin Customers view — it never drifts
 * the way a stored counter can when bookings are cancelled or status changes.
 */
export async function listCustomersWithStats(): Promise<Customer[]> {
  const [customers, bookingsSnap] = await Promise.all([
    listCustomers(),
    adminDb.collection("bookings").get(),
  ]);

  const stats = new Map<string, { count: number; last?: string }>();
  for (const d of bookingsSnap.docs) {
    const b = d.data();
    if (b.status === "cancelled") continue;
    const phone: string | undefined = b.customerPhone;
    if (!phone) continue;
    const cur = stats.get(phone) ?? { count: 0 };
    cur.count += 1;
    if (b.date && (!cur.last || b.date > cur.last)) cur.last = b.date;
    stats.set(phone, cur);
  }

  const withStats = customers.map((c) => {
    const s = stats.get(c.phone);
    return {
      ...c,
      totalBookings: s?.count ?? 0,
      lastBookingDate: s?.last ?? c.lastBookingDate,
    };
  });
  // Most recent active booking first; zero-active customers sink to the bottom.
  withStats.sort(
    (a, b) =>
      b.totalBookings - a.totalBookings ||
      (b.lastBookingDate ?? "").localeCompare(a.lastBookingDate ?? ""),
  );
  return withStats;
}
