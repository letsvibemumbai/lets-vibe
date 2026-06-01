import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Booking, ScreenId } from "@/types";

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

function toBooking(id: string, data: Record<string, unknown>): Booking {
  return { id, ...data } as Booking;
}

export async function getBookingsByDate(date: string): Promise<Booking[]> {
  const q = query(
    collection(db, COLLECTION),
    where("date", "==", date),
    orderBy("startTime"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toBooking(d.id, d.data()));
}

export async function getBookingsForScreenDate(
  screenId: ScreenId,
  date: string,
): Promise<Booking[]> {
  const q = query(
    collection(db, COLLECTION),
    where("screenId", "==", screenId),
    where("date", "==", date),
    orderBy("startTime"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toBooking(d.id, d.data()));
}

export async function getBookingsInRange(
  startDate: string,
  endDate: string,
): Promise<Booking[]> {
  const q = query(
    collection(db, COLLECTION),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date"),
    orderBy("startTime"),
  );
  const snap = await getDocs(q);
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
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return toBooking(snap.id, snap.data());
}

export async function createBooking(data: NewBooking): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateBooking(
  id: string,
  data: Partial<Omit<Booking, "id" | "createdAt">>,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
