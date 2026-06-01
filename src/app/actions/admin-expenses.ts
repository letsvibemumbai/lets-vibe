"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import {
  createExpense,
  deleteExpense,
  getExpense,
  listExpenses,
  updateExpense,
  type ExpenseListFilters,
} from "@/lib/db/expenses.server";
import type { Expense } from "@/types";

const IdSchema = z.string().min(1);
const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");
const CategorySchema = z.enum([
  "utilities",
  "staff",
  "supplies",
  "maintenance",
  "marketing",
  "other",
]);
const MethodSchema = z.enum(["cash", "upi", "card", "bank"]);

const ExpenseSchema = z.object({
  date: DateSchema,
  category: CategorySchema,
  description: z.string().trim().min(1, "Description required").max(200),
  amount: z.number().int().min(0),
  paymentMethod: MethodSchema,
  receiptUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type ExpensePayload = z.infer<typeof ExpenseSchema>;

function revalidate(id?: string) {
  revalidatePath("/admin/expenses");
  revalidatePath("/admin/accounting");
  revalidatePath("/admin/reports");
  revalidatePath("/admin");
  if (id) revalidatePath(`/admin/expenses/${id}`);
}

export async function createExpenseAction(raw: ExpensePayload): Promise<string> {
  await requireAdmin();
  const data = ExpenseSchema.parse(raw);
  const id = await createExpense({
    date: data.date,
    category: data.category,
    description: data.description,
    amount: data.amount,
    paymentMethod: data.paymentMethod,
    receiptUrl: data.receiptUrl,
  });
  revalidate();
  return id;
}

export async function updateExpenseAction(
  rawId: string,
  raw: ExpensePayload,
): Promise<void> {
  await requireAdmin();
  const id = IdSchema.parse(rawId);
  const data = ExpenseSchema.parse(raw);
  const existing = await getExpense(id);
  if (!existing) throw new Error("Expense not found");
  await updateExpense(id, {
    date: data.date,
    category: data.category,
    description: data.description,
    amount: data.amount,
    paymentMethod: data.paymentMethod,
    receiptUrl: data.receiptUrl,
  });
  revalidate(id);
}

export async function deleteExpenseAction(rawId: string): Promise<void> {
  await requireAdmin();
  const id = IdSchema.parse(rawId);
  await deleteExpense(id);
  revalidate();
}

const FiltersSchema = z.object({
  category: CategorySchema.optional(),
  paymentMethod: MethodSchema.optional(),
  dateFrom: DateSchema.optional(),
  dateTo: DateSchema.optional(),
});

function csvEscape(v: string | number | undefined | null): string {
  const s = v === undefined || v === null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function expensesToCsv(rows: Expense[]): string {
  const headers = [
    "id",
    "date",
    "category",
    "description",
    "amount",
    "paymentMethod",
    "receiptUrl",
    "createdAt",
  ];
  const lines = [headers.join(",")];
  for (const e of rows) {
    lines.push(
      [
        csvEscape(e.id),
        csvEscape(e.date),
        csvEscape(e.category),
        csvEscape(e.description),
        csvEscape(e.amount),
        csvEscape(e.paymentMethod),
        csvEscape(e.receiptUrl),
        csvEscape(
          typeof e.createdAt === "number"
            ? new Date(e.createdAt).toISOString()
            : "",
        ),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export async function exportExpensesCsvAction(
  rawFilters: ExpenseListFilters,
): Promise<string> {
  await requireAdmin();
  const filters = FiltersSchema.parse(rawFilters);
  const rows = await listExpenses(filters);
  return expensesToCsv(rows);
}

// Used by /admin/reports — exports all expenses in a date range.
export async function exportExpensesRangeCsvAction(
  start: string,
  end: string,
): Promise<string> {
  await requireAdmin();
  const { dateFrom, dateTo } = FiltersSchema.parse({
    dateFrom: start,
    dateTo: end,
  });
  const rows = await listExpenses({ dateFrom, dateTo });
  return expensesToCsv(rows);
}
