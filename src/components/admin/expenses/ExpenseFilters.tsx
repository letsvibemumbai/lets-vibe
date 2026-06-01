"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ANY = "__any__";

type Props = {
  category?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
};

export function ExpenseFilters(initial: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  function setParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(params?.toString());
    if (!value || value === ANY) next.delete(key);
    else next.set(key, value);
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  function clear() {
    startTransition(() => router.push(pathname));
  }

  const hasFilters =
    !!initial.category ||
    !!initial.paymentMethod ||
    !!initial.dateFrom ||
    !!initial.dateTo;

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-3xl bg-card p-4 ring-1 ring-white/10 ">
      <FilterField label="Category">
        <Select
          value={initial.category ?? ANY}
          onValueChange={(v) => setParam("category", v)}
        >
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All categories</SelectItem>
            <SelectItem value="utilities">Utilities</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="supplies">Supplies</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField label="Payment method">
        <Select
          value={initial.paymentMethod ?? ANY}
          onValueChange={(v) => setParam("method", v)}
        >
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="All methods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All methods</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="upi">UPI</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="bank">Bank</SelectItem>
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField label="From">
        <Input
          type="date"
          value={initial.dateFrom ?? ""}
          onChange={(e) => setParam("from", e.target.value || undefined)}
          className="h-9 w-40"
        />
      </FilterField>

      <FilterField label="To">
        <Input
          type="date"
          value={initial.dateTo ?? ""}
          onChange={(e) => setParam("to", e.target.value || undefined)}
          className="h-9 w-40"
        />
      </FilterField>

      {hasFilters && (
        <button
          type="button"
          onClick={clear}
          className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm text-foreground/60 hover:bg-cream hover:text-foreground"
        >
          <X className="h-4 w-4" />
          Clear
        </button>
      )}
    </div>
  );
}

function FilterField({
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
