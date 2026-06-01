"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { QuietButton, SectionLabel } from "@/components/editorial";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { useBookingStore } from "@/lib/booking/store";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { confirmBookingDirect } from "@/app/actions/booking";
import type { Screen } from "@/types";

type Props = { screen: Screen };

export function PaymentClient({ screen }: Props) {
  const router = useRouter();
  const draft = useBookingStore();
  const reset = useBookingStore((s) => s.reset);
  const { user } = useAuthUser();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (
      !draft.date ||
      !draft.duration ||
      !draft.startTime ||
      !draft.endTime ||
      !draft.customer ||
      !draft.amount
    ) {
      router.replace(`/book/${screen.id}`);
    }
  }, [
    draft.date,
    draft.duration,
    draft.startTime,
    draft.endTime,
    draft.customer,
    draft.amount,
    screen.id,
    router,
  ]);

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
        <div className="border-y border-hairline py-8">
          <SectionLabel>Total</SectionLabel>
          <p
            className="mt-3 font-display text-4xl leading-none tracking-[-0.01em] text-ink"
            style={{ fontWeight: 400 }}
          >
            ₹{amount.toLocaleString("en-IN")}
          </p>
          <p className="mt-3 text-[12px] text-muted">
            Pay at the venue — no online payment needed right now.
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
