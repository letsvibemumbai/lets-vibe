"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markBookingCompletedAction } from "@/app/actions/admin-bookings";

type Props = {
  bookingId: string;
  disabled?: boolean;
};

export function MarkCompletedButton({ bookingId, disabled }: Props) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function onClick() {
    startTransition(async () => {
      try {
        await markBookingCompletedAction(bookingId);
        setDone(true);
        toast.success("Marked as completed");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't update");
      }
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={onClick}
      disabled={disabled || pending || done}
      className="h-8 rounded-full text-xs"
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Check className="h-3.5 w-3.5" />
      )}
      {done ? "Completed" : "Mark complete"}
    </Button>
  );
}
