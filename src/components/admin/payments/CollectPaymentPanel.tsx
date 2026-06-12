"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Banknote, Check, Loader2, Smartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  recordBookingPaymentAction,
  removeBookingPaymentAction,
} from "@/app/actions/payments";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABEL,
  balanceDue,
  collectedByMethod,
  effectivePayments,
  totalCollected,
} from "@/lib/booking/payments";
import { formatINR } from "@/components/admin/dashboard/utils";
import { cn } from "@/lib/utils";
import type { Booking } from "@/types";

type DoorMethod = "upi" | "cash";

export function CollectPaymentPanel({ booking }: { booking: Booking }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const ledger = effectivePayments(booking);
  const collected = totalCollected(booking);
  const due = balanceDue(booking);
  const byMethod = collectedByMethod(booking);

  const [amount, setAmount] = useState<number>(due);
  const [method, setMethod] = useState<DoorMethod>("upi");
  const [note, setNote] = useState("");

  // After a payment is recorded the server sends a fresh booking; reset the
  // amount input to the new balance due.
  useEffect(() => {
    setAmount(balanceDue(booking));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking.amountPaid, booking.amount]);

  function record() {
    if (amount <= 0) {
      toast.error("Enter an amount greater than zero");
      return;
    }
    startTransition(async () => {
      try {
        await recordBookingPaymentAction(booking.id, {
          amount,
          method,
          note: note.trim() || undefined,
        });
        toast.success(`${formatINR(amount)} recorded · ${method.toUpperCase()}`);
        setNote("");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't record payment");
      }
    });
  }

  function remove(paymentId: string) {
    startTransition(async () => {
      try {
        await removeBookingPaymentAction(booking.id, paymentId);
        toast.success("Payment removed");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't remove payment");
      }
    });
  }

  const fullyPaid = due <= 0;

  return (
    <div className="space-y-5">
      {/* Totals */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat label="Total" value={formatINR(booking.amount)} />
        <Stat label="Collected" value={formatINR(collected)} tone="up" />
        <Stat
          label="Balance due"
          value={formatINR(due)}
          tone={fullyPaid ? "up" : "down"}
        />
      </div>

      {/* UPI / Cash split of what's collected */}
      {collected > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          {PAYMENT_METHODS.filter((m) => byMethod[m] > 0).map((m) => (
              <span
                key={m}
                className="inline-flex items-center gap-1.5 rounded-full bg-cream px-2.5 py-1 text-foreground/70"
              >
                <span className="font-medium text-foreground">
                  {PAYMENT_METHOD_LABEL[m]}
                </span>
                {formatINR(byMethod[m])}
              </span>
            ))}
        </div>
      )}

      {/* Record a new payment */}
      {fullyPaid ? (
        <p className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 ring-1 ring-emerald-500/20">
          <Check className="h-4 w-4" strokeWidth={2.5} />
          Paid in full — no balance outstanding.
        </p>
      ) : (
        <div className="space-y-3 rounded-2xl border border-hairline p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/55">
            Collect a payment
          </p>
          <div className="grid grid-cols-2 gap-2">
            <MethodButton
              active={method === "upi"}
              onClick={() => setMethod("upi")}
              icon={<Smartphone className="h-4 w-4" />}
              label="UPI"
            />
            <MethodButton
              active={method === "cash"}
              onClick={() => setMethod("cash")}
              icon={<Banknote className="h-4 w-4" />}
              label="Cash"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground/50">
                ₹
              </span>
              <Input
                type="number"
                min={1}
                value={amount || ""}
                onChange={(e) =>
                  setAmount(Math.max(0, Math.round(Number(e.target.value) || 0)))
                }
                className="pl-7"
                aria-label="Amount"
              />
            </div>
            <Button
              type="button"
              onClick={() => setAmount(due)}
              variant="outline"
              size="sm"
              disabled={pending}
            >
              Full balance
            </Button>
          </div>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional) — e.g. UPI ref"
            maxLength={200}
          />
          <Button
            type="button"
            onClick={record}
            disabled={pending || amount <= 0}
            className="w-full"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" strokeWidth={2.5} />
            )}
            Record {amount > 0 ? formatINR(amount) : "payment"} ·{" "}
            {method.toUpperCase()}
          </Button>
        </div>
      )}

      {/* Ledger */}
      {ledger.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/45">
            Payments ({ledger.length})
          </p>
          <ul className="space-y-1.5">
            {ledger.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 border-b border-hairline py-1.5 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{formatINR(p.amount)}</span>
                    <span className="ml-2 text-xs uppercase tracking-wide text-foreground/55">
                      {PAYMENT_METHOD_LABEL[p.method]}
                    </span>
                    <span className="ml-1.5 text-[11px] text-foreground/40">
                      {p.channel === "online" ? "online" : "at venue"}
                    </span>
                  </p>
                  {(p.at > 0 || p.note) && (
                    <p className="text-[11px] text-foreground/45">
                      {p.at > 0 ? format(p.at, "d MMM, p") : ""}
                      {p.at > 0 && p.note ? " · " : ""}
                      {p.note ?? ""}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  disabled={pending}
                  aria-label="Remove payment"
                  className="shrink-0 rounded-md p-1.5 text-foreground/40 transition-colors hover:bg-rose-500/10 hover:text-rose-500 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
}) {
  const color =
    tone === "up"
      ? "text-emerald-700"
      : tone === "down"
        ? "text-rose-700"
        : "text-foreground";
  return (
    <div className="rounded-2xl bg-cream/60 px-2 py-3">
      <p className="text-[10px] uppercase tracking-wider text-foreground/45">
        {label}
      </p>
      <p className={cn("mt-1 text-sm font-semibold tabular-nums", color)}>
        {value}
      </p>
    </div>
  );
}

function MethodButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-hairline-strong text-foreground/70 hover:border-foreground/40",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
