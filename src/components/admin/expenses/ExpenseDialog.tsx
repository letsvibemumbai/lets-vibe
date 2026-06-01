"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Paperclip, Save, Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createExpenseAction,
  updateExpenseAction,
} from "@/app/actions/admin-expenses";
import type {
  Expense,
  ExpenseCategory,
  ExpensePaymentMethod,
} from "@/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense;
};

const CATEGORIES: ExpenseCategory[] = [
  "utilities",
  "staff",
  "supplies",
  "maintenance",
  "marketing",
  "other",
];

const METHODS: { value: ExpensePaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank", label: "Bank transfer" },
];

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ExpenseDialog({ open, onOpenChange, expense }: Props) {
  const router = useRouter();
  const isEdit = !!expense;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  const [date, setDate] = useState(expense?.date ?? todayIso());
  const [category, setCategory] = useState<ExpenseCategory>(
    expense?.category ?? "supplies",
  );
  const [description, setDescription] = useState(expense?.description ?? "");
  const [amount, setAmount] = useState<number>(expense?.amount ?? 0);
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>(
    expense?.paymentMethod ?? "cash",
  );
  const [receiptUrl, setReceiptUrl] = useState(expense?.receiptUrl ?? "");
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Reset form when dialog opens/closes with a different expense.
  useEffect(() => {
    if (!open) return;
    setDate(expense?.date ?? todayIso());
    setCategory(expense?.category ?? "supplies");
    setDescription(expense?.description ?? "");
    setAmount(expense?.amount ?? 0);
    setPaymentMethod(expense?.paymentMethod ?? "cash");
    setReceiptUrl(expense?.receiptUrl ?? "");
    setPendingFile(null);
  }, [open, expense]);

  async function uploadReceipt(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/expenses/receipt", {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? "Upload failed");
    }
    const data = (await res.json()) as { url: string };
    return data.url;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!description.trim() || amount <= 0) {
      toast.error("Description and amount are required");
      return;
    }
    let finalReceiptUrl = receiptUrl || undefined;
    if (pendingFile) {
      setUploading(true);
      try {
        finalReceiptUrl = await uploadReceipt(pendingFile);
      } catch (err) {
        setUploading(false);
        toast.error(err instanceof Error ? err.message : "Upload failed");
        return;
      } finally {
        setUploading(false);
      }
    }
    startTransition(async () => {
      try {
        const payload = {
          date,
          category,
          description: description.trim(),
          amount,
          paymentMethod,
          receiptUrl: finalReceiptUrl,
        };
        if (isEdit && expense) {
          await updateExpenseAction(expense.id, payload);
          toast.success("Expense updated");
        } else {
          await createExpenseAction(payload);
          toast.success("Expense recorded");
        }
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  const busy = pending || uploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit expense" : "Add expense"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this expense entry."
              : "Record a new expense. Attach a receipt if you have one."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="date" label="Date">
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </Field>
            <Field label="Category">
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as ExpenseCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field id="description" label="Description">
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this for?"
              required
              maxLength={200}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="amount" label="Amount (₹)">
              <Input
                id="amount"
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                required
              />
            </Field>
            <Field label="Method">
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as ExpensePaymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Receipt (optional)">
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setPendingFile(f);
                }}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {pendingFile || receiptUrl ? "Replace" : "Choose file"}
                </Button>
                {pendingFile ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-cream px-3 py-1 text-xs">
                    <Paperclip className="h-3 w-3" />
                    {pendingFile.name}
                    <button
                      type="button"
                      aria-label="Remove file"
                      onClick={() => {
                        setPendingFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ) : receiptUrl ? (
                  <a
                    href={receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1 text-xs hover:underline"
                  >
                    <Paperclip className="h-3 w-3" />
                    Existing receipt
                  </a>
                ) : (
                  <span className="text-xs text-foreground/55">
                    JPG, PNG, WebP, or PDF up to 5MB
                  </span>
                )}
                {receiptUrl && !pendingFile && (
                  <button
                    type="button"
                    onClick={() => setReceiptUrl("")}
                    className="text-xs text-foreground/55 hover:text-foreground"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEdit ? "Save changes" : "Add expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id?: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
