"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, RotateCcw, X } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  admitBookingAction,
  rejectBookingAction,
  undoCheckInAction,
} from "@/app/actions/checkin";
import type { Booking } from "@/types";
import type { CheckInRecommendation } from "@/lib/checkin/evaluate";

type Props = {
  booking: Booking;
  recommendation: CheckInRecommendation;
  warnings: string[];
};

export function CheckInActions({ booking, recommendation, warnings }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState("");
  const status = booking.checkInStatus ?? "awaiting";

  function run(fn: () => Promise<void>, okMsg: string) {
    startTransition(async () => {
      try {
        await fn();
        toast.success(okMsg);
        setRejectOpen(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Action failed");
      }
    });
  }

  const doAdmit = () => run(() => admitBookingAction(booking.id), "Entry granted");
  const doReject = () =>
    run(() => rejectBookingAction(booking.id, note || undefined), "Entry rejected");
  const doUndo = () => run(() => undoCheckInAction(booking.id), "Reset to awaiting");

  // Already admitted → show the done state + an undo escape hatch.
  if (status === "admitted") {
    return (
      <div className="flex flex-col gap-3 rounded-3xl bg-emerald-500/10 p-5 ring-1 ring-emerald-500/30 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 font-semibold text-emerald-300">
          <Check className="h-5 w-5" strokeWidth={2.5} />
          Admitted — entry granted.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={doUndo}
          disabled={pending}
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" />
          )}
          Undo admission
        </Button>
      </div>
    );
  }

  const admitGreen =
    "bg-emerald-600 text-white hover:bg-emerald-600/90 focus-visible:ring-emerald-500";

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {recommendation === "admit" ? (
        <Button
          size="lg"
          onClick={doAdmit}
          disabled={pending}
          className={`flex-1 ${admitGreen}`}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" strokeWidth={2.5} />
          )}
          Admit — grant entry
        </Button>
      ) : (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="lg" disabled={pending} className={`flex-1 ${admitGreen}`}>
              <Check className="h-4 w-4" strokeWidth={2.5} />
              Admit anyway
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Admit despite warnings?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div>
                  {warnings.length > 0 ? (
                    <ul className="mb-3 list-disc space-y-1 pl-5 text-foreground/80">
                      {warnings.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  ) : null}
                  Confirm the guest in front of you matches this booking before
                  granting entry.
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending}>Back</AlertDialogCancel>
              <AlertDialogAction
                onClick={doAdmit}
                disabled={pending}
                className={admitGreen}
              >
                {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Admit anyway
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogTrigger asChild>
          <Button size="lg" variant="outline" disabled={pending} className="flex-1">
            <X className="h-4 w-4" />
            {status === "rejected" ? "Rejected" : "Reject entry"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This records a door rejection. It does not cancel the booking or
              issue a refund — handle those separately if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="Reason (optional) — e.g. wrong date, no-show dispute"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={doReject}
              disabled={pending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Reject entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {status === "rejected" && (
        <Button
          variant="ghost"
          size="lg"
          onClick={doUndo}
          disabled={pending}
          className="sm:flex-none"
        >
          <RotateCcw className="h-4 w-4" />
          Undo
        </Button>
      )}
    </div>
  );
}
