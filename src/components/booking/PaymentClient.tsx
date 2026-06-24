"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check, Copy, Loader2, ShieldCheck, Upload } from "lucide-react";
import { toast } from "sonner";
import { QuietButton, SectionLabel } from "@/components/editorial";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { useBookingStore } from "@/lib/booking/store";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { submitUpiBooking } from "@/app/actions/booking";
import { depositAmount, balanceAmount, buildUpiUri } from "@/lib/booking/payments";
import { cn } from "@/lib/utils";
import type { PaymentSettings, Screen } from "@/types";

type Props = { screen: Screen; payment: PaymentSettings };

export function PaymentClient({ screen, payment }: Props) {
  const router = useRouter();
  const draft = useBookingStore();
  const reset = useBookingStore((s) => s.reset);
  const setPaymentPlan = useBookingStore((s) => s.setPaymentPlan);
  const setPaymentScreenshotPath = useBookingStore(
    (s) => s.setPaymentScreenshotPath,
  );
  const { user } = useAuthUser();
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  // `screenshotReady` ⇒ the user has a usable proof on this device. The path
  // itself lives in the persisted draft (`draft.paymentScreenshotPath`) so it
  // survives a SLOT_UNAVAILABLE bounce — the user picks a new slot and we
  // reuse the already-uploaded proof rather than asking them to re-pay.
  const screenshotReady = !!draft.paymentScreenshotPath;
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const amount = draft.amount ?? 0;
  const plan = draft.paymentPlan;
  const deposit = depositAmount(amount);
  const balance = balanceAmount(amount);
  const payNow = plan === "deposit" ? deposit : amount;
  const atVenue = plan === "deposit" ? balance : 0;

  const upiUri = buildUpiUri({
    vpa: payment.upiId,
    payeeName: payment.payeeName || "Let's Vibe",
    amount: payNow,
    note: `Lets Vibe · ${screen.name}`,
  });
  const hasQr = Boolean(payment.upiQrUrl);

  async function handleUpload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Screenshot is over 5MB — please upload a smaller image.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/book/payment-proof", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Upload failed");
      }
      const data = (await res.json()) as { path: string };
      // Persist to the draft store so a SLOT_UNAVAILABLE bounce can recover.
      setPaymentScreenshotPath(data.path);
      toast.success("Screenshot uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function copyUpiId() {
    if (!payment.upiId) return;
    try {
      await navigator.clipboard.writeText(payment.upiId);
      toast.success("UPI ID copied");
    } catch {
      toast.error("Couldn't copy — select and copy manually");
    }
  }

  async function handleSubmit() {
    if (processing) return;
    if (!draft.paymentScreenshotPath) {
      toast.error("Please upload your payment screenshot first.");
      return;
    }
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
      const { bookingId } = await submitUpiBooking({
        screenId: screen.id,
        date: draft.date,
        startTime: draft.startTime,
        endTime: draft.endTime,
        duration: draft.duration,
        customer: draft.customer,
        addOns: draft.addOns,
        customerUid: user?.uid,
        paymentPlan: draft.paymentPlan,
        paymentScreenshotPath: draft.paymentScreenshotPath,
      });

      // Success: write a recovery breadcrumb (so a stuck/back-button user can
      // find their booking) BEFORE clearing the draft, then navigate.
      try {
        window.localStorage.setItem("letsvibe.recentBookingId", bookingId);
      } catch {
        /* localStorage may be disabled — non-fatal */
      }
      reset();
      toast.success("Payment submitted — we'll confirm your booking shortly.");
      router.replace(`/book/${bookingId}/status`);
    } catch (err) {
      setProcessing(false);
      if (err instanceof Error && err.message === "SLOT_UNAVAILABLE") {
        // Don't clear the uploaded screenshot — the customer already paid.
        // Send them back to pick another slot; the proof is reused on retry.
        toast.error(
          "That slot was just taken. Your payment proof is saved — pick a new time and we'll attach it automatically.",
          { duration: 6000 },
        );
        router.replace(`/book/${screen.id}`);
        return;
      }
      const msg =
        err instanceof Error
          ? err.message
          : "Couldn't submit your payment. Please try again.";
      toast.error(msg);
    }
  }

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
          <div className="flex items-baseline justify-between gap-3">
            <SectionLabel>Choose how to pay</SectionLabel>
            <span className="text-[12px] text-muted">
              Total{" "}
              <span className="text-ink">
                ₹{amount.toLocaleString("en-IN")}
              </span>
            </span>
          </div>
          <p className="mt-2 text-[12px] leading-[1.6] text-muted">
            Pick what works for you. Both reserve the slot the moment we verify
            your payment.
          </p>
          <div className="mt-4 space-y-3">
            <PlanOption
              selected={plan === "full"}
              onSelect={() => setPaymentPlan("full")}
              title="Pay in full"
              subtitle="Settle the whole amount now — nothing more to pay at the venue."
              amountLabel={`₹${amount.toLocaleString("en-IN")}`}
              hint="Recommended"
            />
            <PlanOption
              selected={plan === "deposit"}
              onSelect={() => setPaymentPlan("deposit")}
              title="Pay 50% now, 50% at the venue"
              subtitle={`₹${deposit.toLocaleString("en-IN")} now to reserve · ₹${balance.toLocaleString(
                "en-IN",
              )} in cash or UPI when you arrive.`}
              amountLabel={`₹${deposit.toLocaleString("en-IN")}`}
              hint="50% advance"
            />
          </div>
        </div>

        <div className="mt-6 border-y border-hairline py-8">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <SectionLabel>Pay now</SectionLabel>
              {plan === "deposit" && (
                <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-accent">
                  50% advance
                </p>
              )}
            </div>
            <p
              className="font-display text-4xl leading-none tracking-[-0.01em] text-ink"
              style={{ fontWeight: 400 }}
            >
              ₹{payNow.toLocaleString("en-IN")}
            </p>
          </div>
          {plan === "deposit" && (
            <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-hairline pt-4 text-[13px]">
              <span className="text-muted">Due at the venue (cash / UPI)</span>
              <span className="tabular-nums text-ink">
                ₹{atVenue.toLocaleString("en-IN")}
              </span>
            </div>
          )}

          {/* --- Scan & pay --- */}
          <div className="mt-7">
            <SectionLabel>Scan &amp; pay by UPI</SectionLabel>
            {hasQr ? (
              <div className="mt-4 flex flex-col items-center">
                <div className="rounded-2xl bg-cream p-3 ring-1 ring-hairline">
                  <Image
                    src={payment.upiQrUrl!}
                    alt="UPI payment QR code"
                    width={208}
                    height={208}
                    unoptimized
                    className="h-[208px] w-[208px] rounded-lg object-contain"
                  />
                </div>
                <p className="mt-3 text-center text-[12px] leading-[1.6] text-muted">
                  Open GPay / PhonePe / Paytm, scan this code, and pay{" "}
                  <span className="font-medium text-ink">
                    ₹{payNow.toLocaleString("en-IN")}
                  </span>
                  .
                </p>
              </div>
            ) : (
              <p className="mt-4 rounded-sm border border-dashed border-hairline-strong bg-cream/50 px-4 py-3 text-[12px] leading-[1.6] text-muted">
                The venue hasn&rsquo;t set up a UPI QR yet. Please contact us to
                arrange payment, then upload your confirmation below.
              </p>
            )}

            {payment.upiId && (
              <button
                type="button"
                onClick={copyUpiId}
                className="mt-4 flex w-full items-center justify-between gap-3 rounded-sm border border-hairline-strong px-3.5 py-2.5 text-left transition-colors hover:border-ink/40"
              >
                <span className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-[0.22em] text-muted">
                    UPI ID
                  </span>
                  <span className="mt-0.5 block truncate text-[14px] text-ink">
                    {payment.upiId}
                  </span>
                </span>
                <Copy className="h-3.5 w-3.5 shrink-0 text-muted" strokeWidth={1.75} />
              </button>
            )}

            {upiUri && (
              <a
                href={upiUri}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-ink/[0.04] px-3 py-2 text-[12px] font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:bg-ink/[0.08] lg:hidden"
              >
                Open in a UPI app
              </a>
            )}

            {payment.instructions && (
              <p className="mt-4 text-[12px] leading-[1.6] text-muted">
                {payment.instructions}
              </p>
            )}
          </div>

          {/* --- Upload proof --- */}
          <div className="mt-7 border-t border-hairline pt-7">
            <SectionLabel>Upload payment screenshot</SectionLabel>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
              }}
            />
            {screenshotReady ? (
              <div className="mt-4 flex items-center gap-3 rounded-sm border border-hairline-strong bg-emerald-50/40 p-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-emerald-100">
                  <Check
                    className="h-5 w-5 text-emerald-700"
                    strokeWidth={2.5}
                  />
                </span>
                <span className="inline-flex items-center text-[13px] text-ink">
                  Screenshot attached &mdash; ready to submit
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="ml-auto text-[11px] font-medium uppercase tracking-[0.18em] text-muted transition-colors hover:text-ink"
                >
                  Replace
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-sm border border-dashed border-hairline-strong px-4 py-4 text-[13px] text-muted transition-colors hover:border-ink/40 hover:text-ink"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" strokeWidth={1.75} /> Choose
                    screenshot
                  </>
                )}
              </button>
            )}
            <p className="mt-3 text-[12px] leading-[1.6] text-muted">
              After paying, attach the GPay/UPI confirmation. We verify it and
              confirm your booking — you&rsquo;ll get an email once it&rsquo;s
              done.
            </p>
          </div>

          <div className="mt-7">
            <QuietButton
              variant="primary"
              size="lg"
              onClick={handleSubmit}
              disabled={processing || uploading || !screenshotReady}
              arrow={!processing}
              className="w-full"
            >
              {processing ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Submit for confirmation
                </span>
              )}
            </QuietButton>
          </div>

          <p className="mt-5 text-[11px] uppercase tracking-[0.22em] text-muted">
            Confirmed after we verify
          </p>
        </div>

        <p className="mt-5 max-w-xs text-[12px] leading-[1.65] text-muted">
          Your slot is held the moment you submit. We&rsquo;ll review the payment
          and send your confirmation by email.
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
  hint,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle: string;
  amountLabel: string;
  /** Tiny tag rendered next to the title (e.g. "Recommended", "50% advance"). */
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-3 rounded-sm border px-4 py-3.5 text-left transition-colors",
        selected
          ? "border-ink bg-ink/[0.04] ring-1 ring-ink/30"
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
          <span className="flex flex-wrap items-baseline gap-2">
            <span className="text-[14px] font-medium text-ink">{title}</span>
            {hint && (
              <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.18em] text-accent">
                {hint}
              </span>
            )}
          </span>
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
