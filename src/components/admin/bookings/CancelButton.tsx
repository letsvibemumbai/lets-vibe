"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
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
import { cancelBookingAction } from "@/app/actions/admin-bookings";
import type { Booking } from "@/types";

type Props = {
  booking: Booking;
};

export function CancelBookingButton({ booking }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isOnline = booking.source === "online" && !!booking.razorpayPaymentId;
  const alreadyRefunded = !!booking.razorpayRefundId;

  function onConfirm() {
    startTransition(async () => {
      try {
        await cancelBookingAction(booking.id);
        toast.success("Booking cancelled");
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Cancel failed");
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <X className="h-3.5 w-3.5" />
          Cancel booking
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
          <AlertDialogDescription>
            {isOnline && !alreadyRefunded ? (
              <>
                This was paid online. Cancelling does <strong>not</strong> issue
                a refund — use the Refund button afterwards to send the money
                back via Razorpay.
              </>
            ) : isOnline && alreadyRefunded ? (
              <>This booking is already refunded — cancelling just updates the status.</>
            ) : (
              <>The slot will become available again immediately.</>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Keep booking</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={pending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Confirm cancel
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
