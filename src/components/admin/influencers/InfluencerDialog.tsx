"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
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
  createInfluencerAction,
  updateInfluencerAction,
} from "@/app/actions/admin-influencers";
import type {
  ExpensePaymentMethod,
  Influencer,
  InfluencerPerformance,
} from "@/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  influencer?: Influencer;
};

const METHODS: { value: ExpensePaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank", label: "Bank transfer" },
];

const PERFORMANCES: { value: InfluencerPerformance; label: string }[] = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good enough" },
  { value: "bad", label: "Bad" },
  { value: "pending", label: "Pending" },
];

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function InfluencerDialog({ open, onOpenChange, influencer }: Props) {
  const router = useRouter();
  const isEdit = !!influencer;
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(influencer?.name ?? "");
  const [amount, setAmount] = useState<number>(influencer?.amount ?? 0);
  const [dateOfShoot, setDateOfShoot] = useState(
    influencer?.dateOfShoot ?? todayIso(),
  );
  const [igHandle, setIgHandle] = useState(influencer?.igHandle ?? "");
  const [reelLink, setReelLink] = useState(influencer?.reelLink ?? "");
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>(
    influencer?.paymentMethod ?? "cash",
  );
  const [performance, setPerformance] = useState<InfluencerPerformance>(
    influencer?.performance ?? "pending",
  );
  const [notes, setNotes] = useState(influencer?.notes ?? "");

  // Reset form when dialog opens/closes with a different influencer.
  useEffect(() => {
    if (!open) return;
    setName(influencer?.name ?? "");
    setAmount(influencer?.amount ?? 0);
    setDateOfShoot(influencer?.dateOfShoot ?? todayIso());
    setIgHandle(influencer?.igHandle ?? "");
    setReelLink(influencer?.reelLink ?? "");
    setPaymentMethod(influencer?.paymentMethod ?? "cash");
    setPerformance(influencer?.performance ?? "pending");
    setNotes(influencer?.notes ?? "");
  }, [open, influencer]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !igHandle.trim() || amount < 0) {
      toast.error("Name, handle and a valid amount are required");
      return;
    }
    startTransition(async () => {
      try {
        const payload = {
          name: name.trim(),
          amount,
          dateOfShoot,
          igHandle: igHandle.trim(),
          reelLink: reelLink.trim() || undefined,
          paymentMethod,
          performance,
          notes: notes.trim() || undefined,
        };
        if (isEdit && influencer) {
          await updateInfluencerAction(influencer.id, payload);
          toast.success("Influencer updated");
        } else {
          await createInfluencerAction(payload);
          toast.success("Influencer added");
        }
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit influencer" : "Add influencer"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this collaboration. The linked marketing expense updates too."
              : "Record a collaboration. The amount is also logged as a marketing expense."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field id="name" label="Name">
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Influencer name"
              required
              maxLength={80}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="igHandle" label="Instagram handle">
              <Input
                id="igHandle"
                value={igHandle}
                onChange={(e) => setIgHandle(e.target.value)}
                placeholder="@handle"
                required
                maxLength={60}
              />
            </Field>
            <Field id="dateOfShoot" label="Date of shoot">
              <Input
                id="dateOfShoot"
                type="date"
                value={dateOfShoot}
                onChange={(e) => setDateOfShoot(e.target.value)}
                required
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="amount" label="Amount (₹)">
              <Input
                id="amount"
                type="number"
                min={0}
                value={amount}
                onChange={(e) =>
                  setAmount(Math.max(0, Number(e.target.value) || 0))
                }
                required
              />
            </Field>
            <Field label="Method">
              <Select
                value={paymentMethod}
                onValueChange={(v) =>
                  setPaymentMethod(v as ExpensePaymentMethod)
                }
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

          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="reelLink" label="Reel link (optional)">
              <Input
                id="reelLink"
                value={reelLink}
                onChange={(e) => setReelLink(e.target.value)}
                placeholder="https://instagram.com/reel/..."
              />
            </Field>
            <Field label="Performance">
              <Select
                value={performance}
                onValueChange={(v) =>
                  setPerformance(v as InfluencerPerformance)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERFORMANCES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field id="notes" label="Notes (optional)">
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything worth remembering"
              maxLength={500}
            />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEdit ? "Save changes" : "Add influencer"}
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
