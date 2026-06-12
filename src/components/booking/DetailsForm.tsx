"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { QuietButton, SectionLabel } from "@/components/editorial";
import { AddOnsPicker } from "@/components/booking/AddOnsPicker";
import { useBookingStore } from "@/lib/booking/store";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { calculateBookingPrice } from "@/lib/slots/pricing";
import { cn } from "@/lib/utils";
import type {
  AddonItem,
  AddonPackage,
  BookingAddonSelection,
  Screen,
} from "@/types";

const FormSchema = z.object({
  customerName: z.string().trim().min(2, "Please enter your name").max(60),
  customerPhone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
  customerEmail: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "Enter a valid email",
    ),
  guestCount: z
    .number({ message: "Pick a number" })
    .int()
    .min(1, "At least 1 guest")
    .max(10, "Up to 10 guests"),
  decorations: z.string().max(200).optional(),
});

type FormValues = z.infer<typeof FormSchema>;

type Props = {
  screen: Screen;
  items: AddonItem[];
  packages: AddonPackage[];
};

/** Shared bottom-bordered input style. */
const EDITORIAL_INPUT = cn(
  "h-11 w-full border-0 border-b border-hairline-strong bg-transparent",
  "rounded-none px-0 text-[15px] text-ink",
  "placeholder:text-ink/30 focus-visible:border-ink focus-visible:outline-none focus-visible:ring-0",
  "transition-colors",
);

export function DetailsForm({ screen, items, packages }: Props) {
  const router = useRouter();
  const draft = useBookingStore();
  const { user, loading: authLoading } = useAuthUser();

  const [hydrated, setHydrated] = useState(() =>
    useBookingStore.persist?.hasHydrated?.() ?? false,
  );
  useEffect(() => {
    if (hydrated) return;
    const unsub = useBookingStore.persist?.onFinishHydration?.(() => setHydrated(true));
    if (useBookingStore.persist?.hasHydrated?.()) setHydrated(true);
    return () => unsub?.();
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    // Read the live store, not the render snapshot — see PaymentClient note:
    // the first post-rehydration render can still hold the empty SSR snapshot.
    const d = useBookingStore.getState();
    if (!d.date || !d.duration || !d.startTime) {
      router.replace(`/book/${screen.id}`);
    }
  }, [hydrated, screen.id, router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace(`/book/${screen.id}/auth`);
  }, [user, authLoading, screen.id, router]);

  const [selections, setSelections] = useState<BookingAddonSelection[]>(
    () => draft.addOns?.selections ?? [],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      customerName: draft.customer?.name ?? "",
      customerPhone: draft.customer?.phone ?? "",
      customerEmail: draft.customer?.email ?? "",
      guestCount: draft.customer?.guestCount ?? 2,
      decorations: draft.addOns?.decorations ?? "",
    },
  });

  useEffect(() => {
    if (!user) return;
    if (!form.getValues("customerName") && user.displayName) {
      form.setValue("customerName", user.displayName, { shouldDirty: false });
    }
    if (!form.getValues("customerEmail") && user.email) {
      form.setValue("customerEmail", user.email, { shouldDirty: false });
    }
  }, [user, form]);

  const decorationsValue = form.watch("decorations");

  const runningTotal = useMemo(() => {
    if (!draft.duration) return 0;
    return calculateBookingPrice(screen, draft.duration, {
      selections,
      decorations: decorationsValue,
    });
  }, [screen, draft.duration, selections, decorationsValue]);

  function onSubmit(values: FormValues) {
    draft.setCustomer({
      name: values.customerName,
      phone: values.customerPhone,
      email: values.customerEmail || undefined,
      guestCount: values.guestCount,
    });
    draft.setAddOns({
      selections,
      decorations: values.decorations || undefined,
    });
    draft.setAmount(runningTotal);
    router.push(`/book/${screen.id}/payment`);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-12 pb-32 lg:grid-cols-[1fr_22rem] lg:gap-16 lg:pb-0"
      >
        <div className="mx-auto w-full max-w-[500px] space-y-12 lg:max-w-none">
          {/* Customer */}
          <section className="border-t border-hairline pt-10">
            <SectionLabel>Your details</SectionLabel>
            <div className="mt-8 grid grid-cols-1 gap-7 md:grid-cols-2">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase tracking-[0.22em] text-muted">
                      Full name
                    </FormLabel>
                    <FormControl>
                      <input
                        placeholder="Your name"
                        {...field}
                        className={EDITORIAL_INPUT}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase tracking-[0.22em] text-muted">
                      Phone
                    </FormLabel>
                    <FormControl>
                      <input
                        inputMode="tel"
                        placeholder="98xxxxxxxx"
                        maxLength={10}
                        {...field}
                        className={EDITORIAL_INPUT}
                      />
                    </FormControl>
                    <FormDescription className="text-[12px] text-muted">
                      For your booking confirmation.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase tracking-[0.22em] text-muted">
                      Email (optional)
                    </FormLabel>
                    <FormControl>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        {...field}
                        className={EDITORIAL_INPUT}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="guestCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase tracking-[0.22em] text-muted">
                      Number of guests
                    </FormLabel>
                    <FormControl>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className={EDITORIAL_INPUT}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          {/* Add-ons */}
          {(packages.length > 0 || items.length > 0) && (
            <section className="border-t border-hairline pt-10">
              <SectionLabel className="mb-8 block">
                Your experience &amp; add-ons
              </SectionLabel>
              <AddOnsPicker
                items={items}
                packages={packages}
                screenId={screen.id}
                value={selections}
                onChange={setSelections}
              />
            </section>
          )}

          {/* Notes */}
          <section className="border-t border-hairline pt-10">
            <SectionLabel>Notes</SectionLabel>
            <p className="mt-3 text-[14px] leading-[1.65] text-muted">
              A birthday surprise, an allergy, a custom decoration request —
              anything that would help us prepare.
            </p>
            <div className="mt-6">
              <FormField
                control={form.control}
                name="decorations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Optional"
                        {...field}
                        className="rounded-sm border-hairline-strong bg-transparent text-[15px] focus-visible:border-ink focus-visible:ring-0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>
        </div>

        {/* Sidebar / sticky total */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="hidden lg:block">
            <RunningTotal
              amount={runningTotal}
              duration={draft.duration}
              selections={selections}
            />
            <div className="mt-6">
              <QuietButton type="submit" variant="primary" size="lg">
                Continue to payment
              </QuietButton>
            </div>
          </div>
        </aside>

        {/* Mobile sticky bar */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-cream/95 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted">
                Total
              </p>
              <p
                className="mt-0.5 font-display text-2xl leading-none text-ink"
                style={{ fontWeight: 400 }}
              >
                ₹{runningTotal.toLocaleString("en-IN")}
              </p>
            </div>
            <QuietButton type="submit" variant="primary" size="md">
              Continue
            </QuietButton>
          </div>
        </div>
      </form>
    </Form>
  );
}

function RunningTotal({
  amount,
  duration,
  selections,
}: {
  amount: number;
  duration?: number;
  selections: BookingAddonSelection[];
}) {
  return (
    <div className="border-y border-hairline py-8">
      <SectionLabel>Running total</SectionLabel>
      <p
        className="mt-3 font-display text-4xl leading-none text-ink"
        style={{ fontWeight: 400 }}
      >
        ₹{amount.toLocaleString("en-IN")}
      </p>
      <p className="mt-3 text-[12px] text-muted">
        {duration ? `${duration}-hour booking` : "Add-ons update the total live"}
        {selections.length > 0
          ? ` · ${selections.length} add-on${selections.length === 1 ? "" : "s"}`
          : ""}
      </p>
      {selections.length > 0 && (
        <ul className="mt-5 space-y-2 border-t border-hairline pt-4 text-[13px] text-muted">
          {selections.map((sel) => (
            <li
              key={`${sel.kind}:${sel.id}`}
              className="flex items-start justify-between gap-2"
            >
              <span className="truncate">
                {sel.name}
                {sel.quantity > 1 && (
                  <span className="ml-1 text-ink/40">×{sel.quantity}</span>
                )}
              </span>
              <span className="shrink-0 tabular-nums">
                ₹{(sel.unitPrice * sel.quantity).toLocaleString("en-IN")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
