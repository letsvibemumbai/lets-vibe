"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddOnsPicker } from "@/components/booking/AddOnsPicker";
import { updateBookingDetailsAction } from "@/app/actions/admin-bookings";
import type {
  AddonItem,
  AddonPackage,
  Booking,
  BookingAddonSelection,
  BookingStatus,
} from "@/types";

type Props = {
  booking: Booking;
  items: AddonItem[];
  packages: AddonPackage[];
};

const STATUS_OPTIONS: BookingStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

export function BookingEditForm({ booking, items, packages }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [customerName, setCustomerName] = useState(booking.customerName);
  const [customerPhone, setCustomerPhone] = useState(booking.customerPhone);
  const [customerEmail, setCustomerEmail] = useState(
    booking.customerEmail ?? "",
  );
  const [guestCount, setGuestCount] = useState(booking.guestCount);
  const [status, setStatus] = useState<BookingStatus>(booking.status);
  const [notes, setNotes] = useState(booking.notes ?? "");
  const [selections, setSelections] = useState<BookingAddonSelection[]>(
    booking.addOns.selections ?? [],
  );
  const [decorations, setDecorations] = useState(
    booking.addOns.decorations ?? "",
  );

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateBookingDetailsAction(booking.id, {
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim() || undefined,
          guestCount,
          status,
          notes: notes.trim() || undefined,
          addOns: {
            decorations: decorations.trim() || undefined,
            selections: selections.map((s) => ({
              kind: s.kind,
              id: s.id,
              quantity: s.quantity,
            })),
          },
        });
        toast.success("Booking updated");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="customerName" label="Customer name">
          <Input
            id="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            maxLength={60}
          />
        </Field>
        <Field id="customerPhone" label="Phone">
          <Input
            id="customerPhone"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            required
            inputMode="tel"
          />
        </Field>
        <Field id="customerEmail" label="Email (optional)">
          <Input
            id="customerEmail"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
          />
        </Field>
        <Field id="guestCount" label="Guests">
          <Input
            id="guestCount"
            type="number"
            min={1}
            max={10}
            value={guestCount}
            onChange={(e) => setGuestCount(Number(e.target.value) || 1)}
            required
          />
        </Field>
      </div>

      <Field label="Status">
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as BookingStatus)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <div className="space-y-2">
        <Label>Add-ons</Label>
        <AddOnsPicker
          compact
          items={items}
          packages={packages}
          value={selections}
          onChange={setSelections}
        />
      </div>

      <Field id="decorations" label="Decoration note (optional)">
        <Input
          id="decorations"
          value={decorations}
          onChange={(e) => setDecorations(e.target.value)}
          maxLength={200}
        />
      </Field>

      <Field id="notes" label="Notes (internal)">
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={1000}
        />
      </Field>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save changes
        </Button>
      </div>
    </form>
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
