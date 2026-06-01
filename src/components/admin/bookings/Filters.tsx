"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  screen?: string;
  status?: string;
  source?: string;
  dateFrom?: string;
  dateTo?: string;
  query?: string;
};

const ANY = "__any__";

export function BookingsFilters(initial: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const [query, setQuery] = useState(initial.query ?? "");

  function setParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(params?.toString());
    if (!value || value === ANY) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    next.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`);
    });
  }

  // Debounce search input.
  useEffect(() => {
    const id = window.setTimeout(() => {
      if ((initial.query ?? "") !== query) {
        setParam("q", query.trim() || undefined);
      }
    }, 350);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function reset() {
    startTransition(() => router.push(pathname));
    setQuery("");
  }

  const hasFilters =
    !!initial.screen ||
    !!initial.status ||
    !!initial.source ||
    !!initial.dateFrom ||
    !!initial.dateTo ||
    !!initial.query;

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-3xl bg-card p-4 ring-1 ring-white/10 ">
      <FilterField label="Search">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, phone, email"
            className="h-9 w-56 pl-9"
          />
        </div>
      </FilterField>

      <FilterField label="Screen">
        <Select
          value={initial.screen ?? ANY}
          onValueChange={(v) => setParam("screen", v)}
        >
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="All screens" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All screens</SelectItem>
            <SelectItem value="beach">Beach Vibes</SelectItem>
            <SelectItem value="grass">Grass Garden</SelectItem>
            <SelectItem value="forest">Forest Retreat</SelectItem>
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField label="Status">
        <Select
          value={initial.status ?? ANY}
          onValueChange={(v) => setParam("status", v)}
        >
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField label="Source">
        <Select
          value={initial.source ?? ANY}
          onValueChange={(v) => setParam("source", v)}
        >
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="All sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All sources</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
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
          onClick={reset}
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
