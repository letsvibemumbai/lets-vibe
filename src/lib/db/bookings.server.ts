import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type {
  Booking,
  BookingSource,
  BookingStatus,
  ScreenId,
} from "@/types";

const COLLECTION = "bookings";

type NewBooking = Omit<Booking, "id" | "createdAt" | "updatedAt">;

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export function monthRange(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${pad(month)}-01`;
  const last = new Date(year, month, 0).getDate();
  const end = `${year}-${pad(month)}-${pad(last)}`;
  return { start, end };
}

export function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toBooking(id: string, data: FirebaseFirestore.DocumentData): Booking {
  return { id, ...data } as Booking;
}

export async function getBookingsByDate(date: string): Promise<Booking[]> {
  const snap = await adminDb
    .collection(COLLECTION)
    .where("date", "==", date)
    .orderBy("startTime")
    .get();
  return snap.docs.map((d) => toBooking(d.id, d.data()));
}

export async function getBookingsForScreenDate(
  screenId: ScreenId,
  date: string,
): Promise<Booking[]> {
  const snap = await adminDb
    .collection(COLLECTION)
    .where("screenId", "==", screenId)
    .where("date", "==", date)
    .orderBy("startTime")
    .get();
  return snap.docs.map((d) => toBooking(d.id, d.data()));
}

export async function getBookingsInRange(
  startDate: string,
  endDate: string,
): Promise<Booking[]> {
  const snap = await adminDb
    .collection(COLLECTION)
    .where("date", ">=", startDate)
    .where("date", "<=", endDate)
    .orderBy("date")
    .orderBy("startTime")
    .get();
  return snap.docs.map((d) => toBooking(d.id, d.data()));
}

export async function getBookingsForMonth(year: number, month: number): Promise<Booking[]> {
  const { start, end } = monthRange(year, month);
  return getBookingsInRange(start, end);
}

export async function getTodayBookings(): Promise<Booking[]> {
  return getBookingsByDate(todayString());
}

export async function getBooking(id: string): Promise<Booking | null> {
  const snap = await adminDb.collection(COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return toBooking(snap.id, snap.data()!);
}

export async function createBooking(data: NewBooking): Promise<string> {
  const ref = await adminDb.collection(COLLECTION).add({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function updateBooking(
  id: string,
  data: Partial<Omit<Booking, "id" | "createdAt">>,
): Promise<void> {
  await adminDb
    .collection(COLLECTION)
    .doc(id)
    .set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

export type BookingListFilters = {
  screenId?: ScreenId;
  status?: BookingStatus;
  source?: BookingSource;
  dateFrom?: string;
  dateTo?: string;
  query?: string;
};

export type BookingListResult = {
  rows: Booking[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export async function listBookings(
  filters: BookingListFilters,
  page: number,
  pageSize: number,
): Promise<BookingListResult> {
  let q: FirebaseFirestore.Query = adminDb.collection(COLLECTION);
  if (filters.screenId) q = q.where("screenId", "==", filters.screenId);
  if (filters.status) q = q.where("status", "==", filters.status);
  if (filters.source) q = q.where("source", "==", filters.source);
  if (filters.dateFrom) q = q.where("date", ">=", filters.dateFrom);
  if (filters.dateTo) q = q.where("date", "<=", filters.dateTo);
  q = q.orderBy("date", "desc").orderBy("startTime", "desc");

  const snap = await q.get();
  let rows = snap.docs.map((d) => toBooking(d.id, d.data()));

  const needle = filters.query?.trim().toLowerCase();
  if (needle) {
    rows = rows.filter(
      (b) =>
        b.customerName.toLowerCase().includes(needle) ||
        b.customerPhone.toLowerCase().includes(needle) ||
        (b.customerEmail?.toLowerCase().includes(needle) ?? false),
    );
  }

  const total = rows.length;
  const safePage = Math.max(1, page);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(safePage, pageCount);
  const start = (clampedPage - 1) * pageSize;
  const sliced = rows.slice(start, start + pageSize);

  return { rows: sliced, total, page: clampedPage, pageSize, pageCount };
}

export async function listBookingsForExport(
  filters: BookingListFilters,
): Promise<Booking[]> {
  const { rows } = await listBookings(filters, 1, Number.MAX_SAFE_INTEGER);
  return rows;
}

/**
 * All bookings made by a signed-in user (by Firebase Auth uid). Timestamps are
 * normalized to millis so the result is safe to return from a server action to
 * a client component (the /account dashboard). Sorted newest date first.
 */
export async function getBookingsForUser(uid: string): Promise<Booking[]> {
  const snap = await adminDb
    .collection(COLLECTION)
    .where("customerUid", "==", uid)
    .get();
  const rows = snap.docs.map((d) => {
    const data = d.data();
    return {
      ...toBooking(d.id, data),
      createdAt: timestampToMillis(data.createdAt),
      updatedAt: timestampToMillis(data.updatedAt),
    } as Booking;
  });
  rows.sort(
    (a, b) =>
      b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime),
  );
  return rows;
}

export async function getRecentBookings(limit: number): Promise<Booking[]> {
  const snap = await adminDb
    .collection(COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => toBooking(d.id, d.data()));
}

// Firestore Admin returns Timestamp objects for serverTimestamp fields, but
// the Booking type widens to `number`. Normalize for date comparisons.
export function timestampToMillis(value: unknown): number {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "toMillis" in value) {
    const fn = (value as { toMillis: unknown }).toMillis;
    if (typeof fn === "function") return (fn as () => number).call(value);
  }
  return 0;
}
