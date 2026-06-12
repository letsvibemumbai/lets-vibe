"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { QuietButton, SectionLabel } from "@/components/editorial";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { useBookingStore } from "@/lib/booking/store";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { confirmBookingDirect } from "@/app/actions/booking";
import { depositAmount, balanceAmount } from "@/lib/booking/payments";
import { cn } from "@/lib/utils";
import type { Screen } from "@/types";

type Props = { screen: Screen };

export function PaymentClient({ screen }: Props) {
  const router = useRouter();
  const draft = useBookingStore();
  const reset = useBookingStore((s) => s.reset);
  const setPaymentPlan = useBookingStore((s) => s.setPaymentPlan);
  const { user } = useAuthUser();
  const [processing, setProcessing] = useState(false);

  // Wait for the persisted draft to rehydrate from sessionStorage before
  // deciding to redirect — otherwise a refresh or direct load of this page
  // bounces back to /book/[id] before the store has been read back.
  const [hydrated, setHydrated] = useState(
    () => useBookingStore.persist?.hasHydrated?.() ?? false,
  );
  useEffect(() => {
    if (hydrated) return;
    const unsub = useBookingStore.persist?.onFinishHydration?.(() =>
      setHydrated(true),
    );
    if (useBookingStore.persist?.hasHydrated?.()) setHydrated(true);
    return () => unsub?.();
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    // Read the LIVE store, not the render snapshot. On the first client render
    // after rehydration, useSyncExternalStore can still serve the empty SSR
    // snapshot even though the store is already populated — checking that stale
    // snapshot would wrongly bounce a valid draft back to the start.
    const d = useBookingStore.getState();
    if (
      !d.date ||
      !d.duration ||
      !d.startTime ||
      !d.endTime ||
      !d.customer ||
      !d.amount
    ) {
      router.replace(`/book/${screen.id}`);
    }
  }, [hydrated, screen.id, router]);

  async function handlePay() {
    if (processing) return;
    if (
      !draft.date ||
      !draft.duration ||
      !draft.startTime ||
      !draft.endTime ||
      !draft.customer ||
      !draft.amount
    )
      return;

    setProcessing(true);
    try {
      // TEMPORARY: Razorpay bypass — reserve the slot and confirm immediately
      // without the payment gateway. Swap back to createBookingAndOrder +
      // openRazorpay + verifyPayment to re-enable online payment.
      const { bookingId } = await confirmBookingDirect({
        screenId: screen.id,
        date: draft.date,
        startTime: draft.startTime,
        endTime: draft.endTime,
        duration: draft.duration,
        customer: draft.customer,
        addOns: draft.addOns,
        customerUid: user?.uid,
        paymentPlan: draft.paymentPlan,
      });

      reset();
      toast.success("Reserved! Your screen is booked.");
      router.push(`/book/success?bookingId=${bookingId}`);
    } catch (err) {
      const msg =
        err instanceof Error && err.message === "SLOT_UNAVAILABLE"
          ? "That slot was just taken. Please pick another."
          : err instanceof Error
            ? err.message
            : "Couldn't complete your reservation. Please try again.";
      toast.error(msg);
      setProcessing(false);
      if (msg.includes("pick another")) {
        router.replace(`/book/${screen.id}`);
      }
    }
  }

  const amount = draft.amount ?? 0;
  const plan = draft.paymentPlan;
  const deposit = depositAmount(amount);
  const balance = balanceAmount(amount);
  const payNow = plan === "deposit" ? deposit : amount;
  const atVenue = plan === "deposit" ? balance : 0;

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_22rem] lg:gap-16">
      <div>
        <BookingSummary
          screen={screen}
          date={draft.date}
          startTime={draft.startTime}
          endTime={draft.endTime}
          duration={draft.duration}
          guestCount={draft.customer?.guestCount}
          addOns={draft.addOns}
          amount={amount}
        />

        <section className="mt-10 border-b border-hairline pb-10">
          <SectionLabel>Customer</SectionLabel>
          <dl className="mt-5 grid grid-cols-1 gap-4 text-[14px] sm:grid-cols-2">
            <Field label="Name" value={draft.customer?.name} />
            <Field label="Phone" value={draft.customer?.phone} />
            {draft.customer?.email ? (
              <Field label="Email" value={draft.customer.email} />
            ) : null}
            <Field
              label="Guests"
              value={
                draft.customer?.guestCount
                  ? String(draft.customer.guestCount)
                  : undefined
              }
            />
          </dl>
        </section>

        <button
          type="button"
          onClick={() => router.back()}
          className="mt-8 text-[11px] font-medium uppercase tracking-[0.22em] text-muted transition-colors hover:text-ink"
        >
          ← Edit details
        </button>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="border-t border-hairline pt-8">
          <SectionLabel>How would you like to pay?</SectionLabel>
          <div className="mt-5 space-y-3">
            <PlanOption
              selected={plan === "full"}
              onSelect={() => setPaymentPlan("full")}
              title="Pay in full"
              subtitle="Settle the whole amount upfront."
              amountLabel={`₹${amount.toLocaleString("en-IN")}`}
            />
            <PlanOption
              selected={plan === "deposit"}
              onSelect={() => setPaymentPlan("deposit")}
              title="Pay 50% to reserve"
              subtitle={`₹${deposit.toLocaleString("en-IN")} now · ₹${balance.toLocaleString(
                "en-IN",
              )} by cash/UPI at the venue.`}
              amountLabel={`₹${deposit.toLocaleString("en-IN")}`}
            />
          </div>
        </div>

        <div className="mt-6 border-y border-hairline py-8">
          <div className="flex items-baseline justify-between gap-4">
            <SectionLabel>Pay now</SectionLabel>
            <p
              className="font-display text-4xl leading-none tracking-[-0.01em] text-ink"
              style={{ fontWeight: 400 }}
            >
              ₹{payNow.toLocaleString("en-IN")}
            </p>
          </div>
          {plan === "deposit" && (
            <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-hairline pt-4 text-[13px]">
              <span className="text-muted">Due at the venue</span>
              <span className="tabular-nums text-ink">
                ₹{atVenue.toLocaleString("en-IN")}
              </span>
            </div>
          )}
          <p className="mt-4 text-[12px] leading-[1.6] text-muted">
            We&rsquo;ll reserve your slot on confirm. Any balance is collected at
            the venue — you choose cash or UPI on arrival.
          </p>

          <div className="mt-7">
            <QuietButton
              variant="primary"
              size="lg"
              onClick={handlePay}
              disabled={processing}
              arrow={!processing}
              className="w-full"
            >
              {processing ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Reserving
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Reserve this slot
                </span>
              )}
            </QuietButton>
          </div>

          <p className="mt-5 text-[11px] uppercase tracking-[0.22em] text-muted">
            Instant confirmation
          </p>
        </div>

        <p className="mt-5 max-w-xs text-[12px] leading-[1.65] text-muted">
          Your slot is locked in the moment you confirm. We&rsquo;ll send the
          details over straight away.
        </p>
      </aside>
    </div>
  );
}

function PlanOption({
  selected,
  onSelect,
  title,
  subtitle,
  amountLabel,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle: string;
  amountLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-3 rounded-sm border px-4 py-3.5 text-left transition-colors",
        selected
          ? "border-ink bg-ink/[0.03]"
          : "border-hairline-strong hover:border-ink/40",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
          selected ? "border-ink bg-ink text-cream" : "border-hairline-strong",
        )}
      >
        {selected && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-[14px] font-medium text-ink">{title}</span>
          <span className="shrink-0 tabular-nums text-[14px] text-ink">
            {amountLabel}
          </span>
        </span>
        <span className="mt-1 block text-[12px] leading-[1.5] text-muted">
          {subtitle}
        </span>
      </span>
    </button>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.22em] text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-[14px] text-ink">{value ?? "—"}</dd>
    </div>
  );
}
