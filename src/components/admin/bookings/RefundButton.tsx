"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Undo2 } from "lucide-react";
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
import { refundBookingAction } from "@/app/actions/admin-bookings";
import { formatINR } from "@/components/admin/dashboard/utils";
import type { Booking } from "@/types";

type Props = {
  booking: Booking;
};

export function RefundButton({ booking }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      try {
        await refundBookingAction(booking.id);
        toast.success("Refund initiated");
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Refund failed");
      }
    });
  }

  const amount = booking.amountPaid || booking.amount;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Undo2 className="h-3.5 w-3.5" />
          Refund
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Refund {formatINR(amount)}?</AlertDialogTitle>
          <AlertDialogDescription>
            This sends a refund request to Razorpay for payment{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              {booking.razorpayPaymentId}
            </code>
            . Settlement to the customer can take 5–10 business days. The
            booking status will be set to cancelled.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Keep payment</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={pending}>
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Confirm refund
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
