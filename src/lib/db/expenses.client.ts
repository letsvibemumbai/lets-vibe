import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Expense } from "@/types";

const COLLECTION = "expenses";

type NewExpense = Omit<Expense, "id" | "createdAt">;

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function monthRange(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${pad(month)}-01`;
  const last = new Date(year, month, 0).getDate();
  const end = `${year}-${pad(month)}-${pad(last)}`;
  return { start, end };
}

function toExpense(id: string, data: Record<string, unknown>): Expense {
  return { id, ...data } as Expense;
}

export async function getExpense(id: string): Promise<Expense | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return toExpense(snap.id, snap.data());
}

export async function getExpensesInRange(
  startDate: string,
  endDate: string,
): Promise<Expense[]> {
  const q = query(
    collection(db, COLLECTION),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toExpense(d.id, d.data()));
}

export async function getExpensesForMonth(year: number, month: number): Promise<Expense[]> {
  const { start, end } = monthRange(year, month);
  return getExpensesInRange(start, end);
}

export async function createExpense(data: NewExpense): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateExpense(
  id: string,
  data: Partial<Omit<Expense, "id" | "createdAt">>,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), data);
}

export async function deleteExpense(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
