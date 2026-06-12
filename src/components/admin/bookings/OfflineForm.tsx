"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { format } from "date-fns";
import { Calendar, Clock, Loader2, Save } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { reconcileSelectionsForScreen } from "@/lib/booking/addons";
import { AddOnsPicker } from "@/components/booking/AddOnsPicker";
import { calculateBookingPrice } from "@/lib/slots/pricing";
import type { Slot } from "@/lib/slots/engine";
import {
  createOfflineBookingAction,
  getOfflineSlotsAction,
} from "@/app/actions/admin-bookings";
import {
  formatINR,
  SCREEN_LABEL,
} from "@/components/admin/dashboard/utils";
import type {
  AddonItem,
  AddonPackage,
  BookingAddonSelection,
  BookingPaymentMethod,
  Duration,
  Screen,
  ScreenId,
} from "@/types";

type Props = {
  screens: Screen[];
  items: AddonItem[];
  packages: AddonPackage[];
};

const DURATIONS: Duration[] = [1, 2, 3];
const METHODS: { value: BookingPaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank", label: "Bank transfer" },
];

function todayIso(): string {
  const d = new Date();
  return format(d, "yyyy-MM-dd");
}

export function OfflineBookingForm({ screens, items, packages }: Props) {
  const [screenId, setScreenId] = useState<ScreenId>(
    (screens[0]?.id as ScreenId) ?? "beach",
  );
  const screen = useMemo(
    () => screens.find((s) => s.id === screenId) ?? screens[0],
    [screens, screenId],
  );

  const [date, setDate] = useState(todayIso());
  const [duration, setDuration] = useState<Duration>(2);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsPending, startSlotsTransition] = useTransition();
  const [startTime, setStartTime] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [guestCount, setGuestCount] = useState(2);

  const [selections, setSelections] = useState<BookingAddonSelection[]>([]);
  const [decorations, setDecorations] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<BookingPaymentMethod>("cash");

  const computedPrice = screen
    ? calculateBookingPrice(screen, duration, {
        selections,
        decorations: decorations || undefined,
      })
    : 0;
  const [amount, setAmount] = useState<number>(computedPrice);
  const [amountManuallyEdited, setAmountManuallyEdited] = useState(false);

  const [notes, setNotes] = useState("");
  const [submitting, startSubmitTransition] = useTransition();

  useEffect(() => {
    if (!amountManuallyEdited) setAmount(computedPrice);
  }, [computedPrice, amountManuallyEdited]);

  // Screen switches mid-form: drop items the new screen doesn't offer (e.g.
  // Rose petals off forest) and re-snapshot per-screen package prices.
  useEffect(() => {
    setSelections((prev) => {
      const { selections: next, removed } = reconcileSelectionsForScreen(
        prev,
        items,
        packages,
        screenId,
      );
      if (removed.length) {
        toast.info(
          `Removed (not offered on this screen): ${removed.join(", ")}`,
        );
      }
      return next;
    });
  }, [screenId, items, packages]);

  useEffect(() => {
    setStartTime(null);
    startSlotsTransition(async () => {
      try {
        const result = await getOfflineSlotsAction(screenId, date, duration);
        setSlots(result);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't load slots");
        setSlots([]);
      }
    });
  }, [screenId, date, duration]);

  const discount = Math.max(0, computedPrice - amount);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!startTime) {
      toast.error("Pick a time slot first");
      return;
    }
    startSubmitTransition(async () => {
      try {
        await createOfflineBookingAction({
          screenId,
          date,
          duration,
          startTime,
          customer: {
            name: customerName.trim(),
            phone: customerPhone.trim(),
            email: customerEmail.trim() || undefined,
            guestCount,
          },
          addOns: {
            decorations: decorations.trim() || undefined,
            selections: selections.map((s) => ({
              kind: s.kind,
              id: s.id,
              quantity: s.quantity,
            })),
          },
          paymentMethod,
          amount,
          notes: notes.trim() || undefined,
        });
        // Server action redirects on success — only reached on failure.
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Couldn't save";
        if (msg === "SLOT_UNAVAILABLE") {
          toast.error("That slot was just booked. Pick another.");
        } else if (msg.startsWith("NEXT_REDIRECT")) {
          // success path — no-op
        } else {
          toast.error(msg);
        }
      }
    });
  }

  if (!screen) {
    return (
      <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
        No screens configured. Run <code>npm run seed</code>.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Section title="Slot" icon={<Calendar className="h-4 w-4" />}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Screen">
            <Select value={screenId} onValueChange={(v) => setScreenId(v as ScreenId)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {screens.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {SCREEN_LABEL[s.id]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Date">
            <Input
              type="date"
              value={date}
              min={todayIso()}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </Field>
          <Field label="Duration">
            <Select
              value={String(duration)}
              onValueChange={(v) => setDuration(Number(v) as Duration)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATIONS.map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d} hour{d > 1 ? "s" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="mt-4">
          <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-foreground/55">
            <Clock className="h-3.5 w-3.5" />
            Available start times
          </Label>
          <div className="mt-2 min-h-12">
            {slotsPending ? (
              <p className="flex items-center gap-2 text-sm text-foreground/55">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading slots…
              </p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-foreground/55">
                No slots available for this date and duration.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((s) => (
                  <button
                    key={s.startTime}
                    type="button"
                    onClick={() => setStartTime(s.startTime)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition-colors",
                      startTime === s.startTime
                        ? "bg-foreground text-cream ring-foreground"
                        : "bg-card ring-hairline-strong hover:bg-cream",
                    )}
                  >
                    {s.startTime}–{s.endTime}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Section>

      <Section title="Customer">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="name" label="Name">
            <Input
              id="name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              maxLength={60}
            />
          </Field>
          <Field id="phone" label="Phone">
            <Input
              id="phone"
              inputMode="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
              placeholder="10-digit"
            />
          </Field>
          <Field id="email" label="Email (optional)">
            <Input
              id="email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </Field>
          <Field id="guests" label="Guests">
            <Input
              id="guests"
              type="number"
              min={1}
              max={10}
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value) || 1)}
              required
            />
          </Field>
        </div>
      </Section>

      <Section title="Add-ons">
        <AddOnsPicker
          compact
          items={items}
          packages={packages}
          screenId={screenId}
          value={selections}
          onChange={setSelections}
        />
        <div className="mt-4">
          <Field id="decorations" label="Decoration note (optional)">
            <Input
              id="decorations"
              value={decorations}
              onChange={(e) => setDecorations(e.target.value)}
              maxLength={200}
            />
          </Field>
        </div>
      </Section>

      <Section title="Payment">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Method">
            <Select
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as BookingPaymentMethod)}
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
          <Field id="amount" label={`Amount (auto: ${formatINR(computedPrice)})`}>
            <Input
              id="amount"
              type="number"
              min={0}
              value={amount}
              onChange={(e) => {
                setAmount(Math.max(0, Number(e.target.value) || 0));
                setAmountManuallyEdited(true);
              }}
            />
          </Field>
        </div>
        {discount > 0 && (
          <p className="mt-2 text-xs text-amber-700">
            Discount: {formatINR(discount)} (logged on the booking)
          </p>
        )}
      </Section>

      <Section title="Notes">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Internal notes about this booking"
        />
      </Section>

      <div className="flex items-center justify-between rounded-3xl bg-card p-4 ring-1 ring-hairline">
        <div>
          <p className="text-xs uppercase tracking-wider text-foreground/55">
            Total
          </p>
          <p className="font-display text-2xl text-foreground">
            {formatINR(amount)}
          </p>
        </div>
        <Button type="submit" disabled={submitting || !startTime || !customerName || !customerPhone}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save offline booking
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-card p-6 ring-1 ring-hairline ">
      <header className="mb-4 flex items-center gap-2 text-foreground/70">
        {icon}
        <h2 className="text-sm font-semibold uppercase tracking-wider">
          {title}
        </h2>
      </header>
      {children}
    </section>
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
