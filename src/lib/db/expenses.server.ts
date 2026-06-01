import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
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
  return { id, ...data } as Expense;
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
    .orderBy("date", "desc")
    .get();
  return snap.docs.map((d) => toExpense(d.id, d.data()));
}

export async function getExpensesForMonth(year: number, month: number): Promise<Expense[]> {
  const { start, end } = monthRange(year, month);
  return getExpensesInRange(start, end);
}

export async function createExpense(data: NewExpense): Promise<string> {
  const ref = await adminDb.collection(COLLECTION).add({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function updateExpense(
  id: string,
  data: Partial<Omit<Expense, "id" | "createdAt">>,
): Promise<void> {
  await adminDb.collection(COLLECTION).doc(id).set(data, { merge: true });
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
  let q: FirebaseFirestore.Query = adminDb.collection(COLLECTION);
  if (filters.category) q = q.where("category", "==", filters.category);
  if (filters.paymentMethod)
    q = q.where("paymentMethod", "==", filters.paymentMethod);
  if (filters.dateFrom) q = q.where("date", ">=", filters.dateFrom);
  if (filters.dateTo) q = q.where("date", "<=", filters.dateTo);
  q = q.orderBy("date", "desc");
  const snap = await q.get();
  return snap.docs.map((d) => toExpense(d.id, d.data()));
}
