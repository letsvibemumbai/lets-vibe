"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { QuietButton, SectionLabel } from "@/components/editorial";
import { signInWithGoogle } from "@/lib/firebase/auth";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { useBookingStore } from "@/lib/booking/store";
import type { ScreenId } from "@/types";

type Props = { screenId: ScreenId };

export function AuthGateClient({ screenId }: Props) {
  const router = useRouter();
  const { user, loading } = useAuthUser();
  const [signingIn, setSigningIn] = useState(false);

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
      router.replace(`/book/${screenId}`);
    }
  }, [hydrated, screenId, router]);

  useEffect(() => {
    if (loading) return;
    if (user) router.replace(`/book/${screenId}/details`);
  }, [user, loading, screenId, router]);

  async function handleGoogle() {
    if (signingIn) return;
    setSigningIn(true);
    // Safety net: a browser's COOP (or Google's own auth page) can stop Firebase
    // from detecting a manually-closed popup, which would otherwise leave this
    // button stuck on "Opening Google". A real sign-in completes via onAuthChange
    // → the redirect effect, so resetting the button here is harmless.
    const safety = window.setTimeout(() => setSigningIn(false), 60_000);
    try {
      await signInWithGoogle();
      window.clearTimeout(safety);
    } catch (err) {
      window.clearTimeout(safety);
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        setSigningIn(false);
        return;
      }
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      toast.error(msg);
      setSigningIn(false);
    }
  }

  const showCTA = !hydrated || loading ? false : !user;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_22rem] lg:gap-16">
      <section className="border-y border-hairline py-12">
        {!hydrated || loading ? (
          <div className="flex h-40 items-center justify-center text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : user ? (
          <div className="flex h-40 flex-col items-center justify-center gap-3 text-center text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-[13px] uppercase tracking-[0.22em]">
              Taking you to the next step
            </p>
          </div>
        ) : (
          <>
            <SectionLabel>Continue with Google</SectionLabel>
            <p
              className="mt-4 font-display text-2xl leading-snug text-ink tracking-[-0.01em] sm:text-3xl"
              style={{ fontWeight: 400 }}
            >
              One tap. No password.
            </p>
            <p className="mt-4 max-w-md text-[14px] leading-[1.7] text-muted">
              We use Google only to remember your booking and prefill the next
              step. Your email is never shared.
            </p>

            <div className="mt-8">
              <QuietButton
                variant="primary"
                size="lg"
                onClick={handleGoogle}
                disabled={!showCTA || signingIn}
                arrow={!signingIn}
              >
                {signingIn ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Opening Google
                  </span>
                ) : (
                  "Continue with Google"
                )}
              </QuietButton>
            </div>

            <p className="mt-6 max-w-md text-[11px] uppercase tracking-[0.22em] text-muted">
              By continuing you agree to our terms.
            </p>
          </>
        )}
      </section>

      <aside className="border-y border-hairline py-12">
        <SectionLabel>Your slot is held</SectionLabel>
        <p className="mt-4 text-[14px] leading-[1.7] text-muted">
          We won&rsquo;t lose the time you picked while you sign in. The room
          is reserved the moment payment confirms.
        </p>
      </aside>
    </div>
  );
}
