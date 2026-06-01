"use client";

import * as React from "react";
import { format } from "date-fns";
import { Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DisplayHeading,
  QuietButton,
  SectionLabel,
} from "@/components/editorial";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { signInWithGoogle, signOut } from "@/lib/firebase/auth";
import { SCREEN_PRESETS, isScreenId } from "@/lib/booking/constants";
import {
  getMembershipConfigAction,
  getMyBookingsAction,
  getMyMembershipAction,
  requestMembershipAction,
} from "@/app/actions/membership";
import type { Booking, Membership, MembershipConfig } from "@/types";

const STATUS_LABEL: Record<Booking["status"], string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

function screenName(id: string): string {
  return isScreenId(id) ? SCREEN_PRESETS[id].name : id;
}

function prettyDate(d: string): string {
  try {
    return format(new Date(`${d}T00:00:00`), "EEE, d MMM yyyy");
  } catch {
    return d;
  }
}

export function AccountClient() {
  const { user, loading } = useAuthUser();
  const [bookings, setBookings] = React.useState<Booking[] | null>(null);
  const [membership, setMembership] = React.useState<Membership | null>(null);
  const [config, setConfig] = React.useState<MembershipConfig | null>(null);
  const [dataLoading, setDataLoading] = React.useState(false);
  const [joining, startJoin] = React.useTransition();
  const [signingIn, setSigningIn] = React.useState(false);

  const uid = user?.uid;
  const refresh = React.useCallback(async (id: string) => {
    setDataLoading(true);
    try {
      const [b, m, c] = await Promise.all([
        getMyBookingsAction(id),
        getMyMembershipAction(id),
        getMembershipConfigAction(),
      ]);
      setBookings(b);
      setMembership(m);
      setConfig(c);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't load your account");
    } finally {
      setDataLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (uid) refresh(uid);
  }, [uid, refresh]);

  async function handleSignIn() {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      if (
        code !== "auth/popup-closed-by-user" &&
        code !== "auth/cancelled-popup-request"
      ) {
        toast.error(err instanceof Error ? err.message : "Sign-in failed");
      }
    } finally {
      setSigningIn(false);
    }
  }

  function handleJoin() {
    const joinUid = user?.uid;
    const joinEmail = user?.email;
    const joinName = user?.displayName ?? undefined;
    if (!joinUid || !joinEmail) return;
    startJoin(async () => {
      try {
        await requestMembershipAction({
          uid: joinUid,
          email: joinEmail,
          name: joinName,
        });
        toast.success("Membership requested — we'll confirm it shortly.");
        await refresh(joinUid);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't request membership");
      }
    });
  }

  // ---- auth states ----
  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center text-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md border-y border-hairline py-16 text-center">
        <SectionLabel tone="accent" className="mb-5">
          Your account
        </SectionLabel>
        <DisplayHeading as="h1" size="md">
          Sign in to continue.
        </DisplayHeading>
        <p className="mx-auto mt-5 max-w-sm text-[14px] leading-[1.7] text-muted">
          See your bookings and manage your Let&rsquo;s Vibe membership. One tap
          with Google — no password.
        </p>
        <div className="mt-8 flex justify-center">
          <QuietButton
            variant="primary"
            size="lg"
            onClick={handleSignIn}
            disabled={signingIn}
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
      </div>
    );
  }

  const firstName = (user.displayName ?? "there").split(" ")[0];

  return (
    <div className="space-y-16">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel tone="accent" className="mb-4">
            Your account
          </SectionLabel>
          <DisplayHeading as="h1" size="lg">
            Hello, {firstName}.
          </DisplayHeading>
        </div>
        <button
          type="button"
          onClick={() => signOut()}
          className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted transition-colors hover:text-ink"
        >
          Sign out
        </button>
      </div>

      {/* Membership */}
      <MembershipCard
        membership={membership}
        config={config}
        joining={joining}
        onJoin={handleJoin}
      />

      {/* Bookings */}
      <section>
        <div className="flex items-end justify-between border-b border-hairline pb-4">
          <SectionLabel>Your bookings</SectionLabel>
          {dataLoading && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
        </div>

        {bookings && bookings.length > 0 ? (
          <ul className="divide-y divide-hairline">
            {bookings.map((b) => (
              <li
                key={b.id}
                className="grid grid-cols-1 items-center gap-2 py-6 sm:grid-cols-12 sm:gap-4"
              >
                <div className="sm:col-span-5">
                  <p
                    className="font-display text-xl leading-tight text-ink"
                    style={{ fontWeight: 400 }}
                  >
                    {screenName(b.screenId)}
                  </p>
                  <p className="mt-1 text-[13px] text-muted">
                    {prettyDate(b.date)} · {b.startTime}–{b.endTime}
                  </p>
                </div>
                <div className="sm:col-span-3">
                  <span className="inline-flex rounded-full bg-cream-tonal px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-ink/80 ring-1 ring-hairline">
                    {STATUS_LABEL[b.status]}
                  </span>
                </div>
                <div className="text-left sm:col-span-4 sm:text-right">
                  <p className="font-display text-lg text-ink" style={{ fontWeight: 400 }}>
                    ₹{b.amount.toLocaleString("en-IN")}
                  </p>
                  {b.discount ? (
                    <p className="text-[12px] text-accent">
                      Member saved ₹{b.discount.toLocaleString("en-IN")}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="border-b border-hairline py-14 text-center">
            <p className="text-[14px] text-muted">
              {dataLoading ? "Loading your bookings…" : "No bookings yet."}
            </p>
            {!dataLoading && (
              <div className="mt-6 flex justify-center">
                <QuietButton href="/book" variant="secondary" size="md">
                  Book a screen
                </QuietButton>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function MembershipCard({
  membership,
  config,
  joining,
  onJoin,
}: {
  membership: Membership | null;
  config: MembershipConfig | null;
  joining: boolean;
  onJoin: () => void;
}) {
  const status = membership?.status ?? "none";

  return (
    <section className="relative overflow-hidden rounded-sm border border-hairline bg-cream-tonal/40 p-7 sm:p-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 120% at 0% 0%, rgba(217,169,76,0.10) 0%, rgba(217,169,76,0) 60%)",
        }}
      />
      <div className="relative flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-md">
          <div className="flex items-center gap-2 text-accent">
            <Crown className="h-4 w-4" />
            <SectionLabel tone="accent">Membership</SectionLabel>
          </div>

          {status === "active" ? (
            <>
              <h2
                className="mt-4 font-display text-3xl leading-tight text-ink"
                style={{ fontWeight: 400 }}
              >
                You&rsquo;re a privileged member.
              </h2>
              <p className="mt-3 text-[14px] leading-[1.7] text-muted">
                <strong className="text-ink">
                  {membership!.remainingDiscountedBookings}
                </strong>{" "}
                discounted booking
                {membership!.remainingDiscountedBookings === 1 ? "" : "s"} left —{" "}
                <strong className="text-ink">{membership!.discountPercent}%</strong>{" "}
                off each, applied automatically at checkout.
              </p>
            </>
          ) : status === "pending" ? (
            <>
              <h2
                className="mt-4 font-display text-3xl leading-tight text-ink"
                style={{ fontWeight: 400 }}
              >
                Membership pending.
              </h2>
              <p className="mt-3 text-[14px] leading-[1.7] text-muted">
                We&rsquo;ll activate your membership once your ₹
                {membership!.price.toLocaleString("en-IN")} is received. You&rsquo;ll
                then get your discount on the next bookings.
              </p>
            </>
          ) : config?.active ? (
            <>
              <h2
                className="mt-4 font-display text-3xl leading-tight text-ink"
                style={{ fontWeight: 400 }}
              >
                Become a member.
              </h2>
              <p className="mt-3 text-[14px] leading-[1.7] text-muted">
                Pay a one-time ₹{config.price.toLocaleString("en-IN")} and get a
                flat <strong className="text-ink">{config.discountPercent}%</strong>{" "}
                off your next{" "}
                <strong className="text-ink">{config.discountedBookings}</strong>{" "}
                bookings.
              </p>
            </>
          ) : (
            <>
              <h2
                className="mt-4 font-display text-3xl leading-tight text-ink"
                style={{ fontWeight: 400 }}
              >
                Membership
              </h2>
              <p className="mt-3 text-[14px] leading-[1.7] text-muted">
                The membership programme isn&rsquo;t open right now. Check back
                soon.
              </p>
            </>
          )}
        </div>

        {status !== "active" && status !== "pending" && config?.active && (
          <QuietButton
            variant="primary"
            size="lg"
            onClick={onJoin}
            disabled={joining}
            arrow={!joining}
          >
            {joining ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Requesting
              </span>
            ) : (
              `Become a member · ₹${config.price.toLocaleString("en-IN")}`
            )}
          </QuietButton>
        )}
      </div>
    </section>
  );
}
