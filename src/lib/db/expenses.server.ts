import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { timestampToMillis } from "@/lib/db/bookings.server";
import type {
  Expense,
  ExpenseCategory,
  ExpensePaymentMethod,
} from "@/types";

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

function toExpense(id: string, data: FirebaseFirestore.DocumentData): Expense {
  // Normalize the Firestore Timestamp so expenses are plain serializable
  // objects (safe to pass to client components).
  return {
    ...(data as Omit<Expense, "id">),
    id,
    createdAt: timestampToMillis(data.createdAt),
  } as Expense;
}

export async function getExpense(id: string): Promise<Expense | null> {
  const snap = await adminDb.collection(COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return toExpense(snap.id, snap.data()!);
}

export async function getExpensesInRange(
  startDate: string,
  endDate: string,
): Promise<Expense[]> {
  const snap = await adminDb
    .collection(COLLECTION)
    .where("date", ">=", startDate)
    .where("date", "<=", endDate)
    .get();
  const rows = snap.docs.map((d) => toExpense(d.id, d.data()));
  rows.sort((a, b) => b.date.localeCompare(a.date));
  return rows;
}

export async function getExpensesForMonth(year: number, month: number): Promise<Expense[]> {
  const { start, end } = monthRange(year, month);
  return getExpensesInRange(start, end);
}

/** Drop undefined fields so Firestore never sees an `undefined` value. */
function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out as Partial<T>;
}

export async function createExpense(data: NewExpense): Promise<string> {
  const ref = await adminDb.collection(COLLECTION).add({
    ...stripUndefined(data as Record<string, unknown>),
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function updateExpense(
  id: string,
  data: Partial<Omit<Expense, "id" | "createdAt">>,
): Promise<void> {
  await adminDb
    .collection(COLLECTION)
    .doc(id)
    .set(stripUndefined(data as Record<string, unknown>), { merge: true });
}

export async function deleteExpense(id: string): Promise<void> {
  await adminDb.collection(COLLECTION).doc(id).delete();
}

export type ExpenseListFilters = {
  category?: ExpenseCategory;
  paymentMethod?: ExpensePaymentMethod;
  dateFrom?: string;
  dateTo?: string;
};

export async function listExpenses(
  filters: ExpenseListFilters,
): Promise<Expense[]> {
  // Index-free: filter + sort in memory to avoid composite indexes for
  // arbitrary filter combinations.
  const snap = await adminDb.collection(COLLECTION).get();
  let rows = snap.docs.map((d) => toExpense(d.id, d.data()));
  if (filters.category) rows = rows.filter((e) => e.category === filters.category);
  if (filters.paymentMethod)
    rows = rows.filter((e) => e.paymentMethod === filters.paymentMethod);
  if (filters.dateFrom) rows = rows.filter((e) => e.date >= filters.dateFrom!);
  if (filters.dateTo) rows = rows.filter((e) => e.date <= filters.dateTo!);
  rows.sort((a, b) => b.date.localeCompare(a.date));
  return rows;
}
