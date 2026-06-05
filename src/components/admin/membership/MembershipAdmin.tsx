"use client";

import { useState, useTransition } from "react";
import { Check, Crown, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  confirmMembershipAction,
  revokeMembershipAction,
  updateMembershipConfigAction,
} from "@/app/actions/membership";
import type { Membership, MembershipConfig, MembershipStatus } from "@/types";

type Props = {
  config: MembershipConfig;
  members: Membership[];
};

const STATUS_STYLES: Record<MembershipStatus, string> = {
  active: "bg-emerald-500/15 text-emerald-300",
  pending: "bg-accent/15 text-accent",
  expired: "bg-foreground/10 text-foreground/60",
  none: "bg-foreground/10 text-foreground/60",
};

function fmtDate(ms: number): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function MembershipAdmin({ config, members }: Props) {
  const [price, setPrice] = useState(config.price);
  const [discountPercent, setDiscountPercent] = useState(config.discountPercent);
  const [discountedBookings, setDiscountedBookings] = useState(
    config.discountedBookings,
  );
  const [active, setActive] = useState(config.active);
  const [savingConfig, startSave] = useTransition();
  const [actingUid, setActingUid] = useState<string | null>(null);
  const [acting, startAct] = useTransition();

  function saveConfig() {
    startSave(async () => {
      try {
        await updateMembershipConfigAction({
          price,
          discountPercent,
          discountedBookings,
          active,
        });
        toast.success("Membership settings saved");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't save settings");
      }
    });
  }

  function run(uid: string, fn: (uid: string) => Promise<void>, ok: string) {
    setActingUid(uid);
    startAct(async () => {
      try {
        await fn(uid);
        toast.success(ok);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Action failed");
      } finally {
        setActingUid(null);
      }
    });
  }

  const pendingCount = members.filter((m) => m.status === "pending").length;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Config */}
      <section className="rounded-3xl bg-card p-6 ring-1 ring-hairline  sm:p-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <Crown className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-2xl text-foreground">
              Membership programme
            </h2>
            <p className="text-sm text-foreground/60">
              Price, discount, and how many bookings it applies to are all live.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <NumberField
            label="Membership price (₹)"
            value={price}
            min={0}
            onChange={setPrice}
          />
          <NumberField
            label="Discount (%)"
            value={discountPercent}
            min={0}
            max={100}
            onChange={setDiscountPercent}
          />
          <NumberField
            label="Discounted bookings"
            value={discountedBookings}
            min={0}
            onChange={setDiscountedBookings}
          />
        </div>

        <label className="mt-5 flex items-center gap-3 text-sm text-foreground">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-transparent accent-[var(--accent)]"
          />
          Programme is active (members can join)
        </label>

        <p className="mt-4 rounded-2xl bg-foreground/[0.04] px-4 py-3 text-[13px] text-foreground/70">
          New members get <strong>{discountPercent}%</strong> off their next{" "}
          <strong>{discountedBookings}</strong> bookings after paying ₹
          {price.toLocaleString("en-IN")}.
        </p>

        <div className="mt-6">
          <button
            type="button"
            onClick={saveConfig}
            disabled={savingConfig}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            {savingConfig && <Loader2 className="h-4 w-4 animate-spin" />}
            Save settings
          </button>
        </div>
      </section>

      {/* Members */}
      <section className="rounded-3xl bg-card p-6 ring-1 ring-hairline  sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-foreground">Members</h2>
          {pendingCount > 0 && (
            <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
              {pendingCount} pending
            </span>
          )}
        </div>

        {members.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-hairline-strong bg-foreground/[0.03] px-6 py-10 text-center text-sm text-foreground/55">
            No membership requests yet.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-hairline">
            {members.map((m) => {
              const busy = acting && actingUid === m.uid;
              return (
                <li
                  key={m.uid}
                  className="flex flex-wrap items-center justify-between gap-3 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {m.name || m.email}
                    </p>
                    <p className="truncate text-[13px] text-foreground/55">
                      {m.email} · requested {fmtDate(m.requestedAt)}
                      {m.status === "active" &&
                        ` · ${m.remainingDiscountedBookings} discounted left`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[m.status]}`}
                    >
                      {m.status}
                    </span>
                    {m.status === "pending" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          run(m.uid, confirmMembershipAction, "Membership confirmed")
                        }
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-[1.03] disabled:opacity-60"
                      >
                        {busy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Confirm
                      </button>
                    )}
                    {(m.status === "active" || m.status === "pending") && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          run(m.uid, revokeMembershipAction, "Membership revoked")
                        }
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-foreground/60 ring-1 ring-hairline-strong transition-colors hover:bg-foreground/5 disabled:opacity-60"
                      >
                        <X className="h-3.5 w-3.5" />
                        Revoke
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-foreground/70">
        {label}
      </span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 w-full rounded-xl border border-hairline-strong bg-card px-3 text-sm text-foreground focus:border-foreground/40 focus:outline-none"
      />
    </label>
  );
}
