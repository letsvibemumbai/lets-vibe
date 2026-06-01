"use client";

import { useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns";
import { Input } from "@/components/ui/input";

type Props = {
  from: string;
  to: string;
};

export function PeriodPicker({ from, to }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  function push(nextFrom: string, nextTo: string) {
    const params = new URLSearchParams({ from: nextFrom, to: nextTo });
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function setFrom(v: string) {
    if (v) push(v, to);
  }
  function setTo(v: string) {
    if (v) push(from, v);
  }

  function preset(kind: "thisMonth" | "lastMonth" | "thisYear") {
    const now = new Date();
    if (kind === "thisMonth") {
      push(
        format(startOfMonth(now), "yyyy-MM-dd"),
        format(endOfMonth(now), "yyyy-MM-dd"),
      );
      return;
    }
    if (kind === "lastMonth") {
      const last = subMonths(now, 1);
      push(
        format(startOfMonth(last), "yyyy-MM-dd"),
        format(endOfMonth(last), "yyyy-MM-dd"),
      );
      return;
    }
    push(
      format(startOfYear(now), "yyyy-MM-dd"),
      format(endOfYear(now), "yyyy-MM-dd"),
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-3xl bg-card p-4 ring-1 ring-white/10 ">
      <Field label="From">
        <Input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="h-9 w-40"
        />
      </Field>
      <Field label="To">
        <Input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="h-9 w-40"
        />
      </Field>
      <div className="flex items-center gap-1 rounded-full bg-cream/60 p-1">
        <Preset onClick={() => preset("thisMonth")}>This month</Preset>
        <Preset onClick={() => preset("lastMonth")}>Last month</Preset>
        <Preset onClick={() => preset("thisYear")}>This year</Preset>
      </div>
    </div>
  );
}

function Preset({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 items-center rounded-full px-3 text-xs font-medium text-foreground/65 hover:bg-card hover:text-foreground"
    >
      {children}
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
        {label}
      </span>
      {children}
    </label>
  );
}
