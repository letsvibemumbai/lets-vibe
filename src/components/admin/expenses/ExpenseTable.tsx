"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, Paperclip, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExpenseDialog } from "./ExpenseDialog";
import { formatINR } from "@/components/admin/dashboard/utils";
import {
  deleteExpenseAction,
  exportExpensesCsvAction,
} from "@/app/actions/admin-expenses";
import type { ExpenseListFilters } from "@/lib/db/expenses.server";
import type { Expense } from "@/types";

type Props = {
  rows: Expense[];
  filters: ExpenseListFilters;
};

export function ExpenseTable({ rows, filters }: Props) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();
  const [exporting, setExporting] = useState(false);

  function onDelete() {
    if (!deleting) return;
    startDeleteTransition(async () => {
      try {
        await deleteExpenseAction(deleting.id);
        toast.success("Expense deleted");
        setDeleting(null);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed");
      }
    });
  }

  async function onExport() {
    setExporting(true);
    try {
      const csv = await exportExpensesCsvAction(filters);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `expenses-${stamp}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-foreground/55">
          {rows.length} {rows.length === 1 ? "expense" : "expenses"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={exporting}
            onClick={onExport}
          >
            {exporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Export CSV
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add expense
          </Button>
        </div>
      </div>

      <div className="rounded-3xl bg-card p-2 ring-1 ring-white/10 ">
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/12 bg-cream/40 px-6 py-12 text-center text-sm text-foreground/55">
            No expenses match these filters.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 [&_th]:text-[11px] [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-foreground/45">
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.id} className="border-white/10">
                  <TableCell className="font-medium text-foreground">
                    {e.date}
                  </TableCell>
                  <TableCell className="text-sm capitalize text-foreground/75">
                    {e.category}
                  </TableCell>
                  <TableCell className="max-w-md truncate text-sm text-foreground/75">
                    {e.description}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground">
                    {formatINR(e.amount)}
                  </TableCell>
                  <TableCell className="text-xs uppercase tracking-wider text-foreground/55">
                    {e.paymentMethod}
                  </TableCell>
                  <TableCell>
                    {e.receiptUrl ? (
                      <a
                        href={e.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
                      >
                        <Paperclip className="h-3 w-3" />
                        View
                      </a>
                    ) : (
                      <span className="text-xs text-foreground/40">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(e)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground/60 hover:bg-cream hover:text-foreground"
                        aria-label="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(e)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground/60 hover:bg-rose-50 hover:text-rose-700"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <ExpenseDialog open={addOpen} onOpenChange={setAddOpen} />
      <ExpenseDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        expense={editing ?? undefined}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.description} · {deleting && formatINR(deleting.amount)}.
              This can&rsquo;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>
              Keep it
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              disabled={deletePending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deletePending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
