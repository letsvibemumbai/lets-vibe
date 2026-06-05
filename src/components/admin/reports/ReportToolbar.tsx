"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Download, FileSpreadsheet, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportBookingsCsvAction } from "@/app/actions/admin-bookings";
import { exportExpensesRangeCsvAction } from "@/app/actions/admin-expenses";

type Props = {
  year: number;
  month: number;
  start: string;
  end: string;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function ReportToolbar({ year, month, start, end }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [downloading, setDownloading] = useState<"bookings" | "expenses" | null>(
    null,
  );

  const years = [];
  const thisYear = new Date().getFullYear();
  for (let y = thisYear - 5; y <= thisYear + 1; y++) years.push(y);

  function setMonth(m: number) {
    const params = new URLSearchParams({ year: String(year), month: String(m) });
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }
  function setYear(y: number) {
    const params = new URLSearchParams({ year: String(y), month: String(month) });
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function onPrint() {
    window.print();
  }

  async function downloadCsv(kind: "bookings" | "expenses") {
    setDownloading(kind);
    try {
      const csv =
        kind === "bookings"
          ? await exportBookingsCsvAction({ dateFrom: start, dateTo: end })
          : await exportExpensesRangeCsvAction(start, end);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${kind}-${start}_to_${end}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="flex flex-wrap items-end justify-between gap-3 rounded-3xl bg-card p-4 ring-1 ring-hairline  print:hidden">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Month">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="h-9 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((label, i) => (
                <SelectItem key={i} value={String(i + 1)}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Year">
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="h-9 w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={downloading === "bookings"}
          onClick={() => downloadCsv("bookings")}
        >
          {downloading === "bookings" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-3.5 w-3.5" />
          )}
          Bookings CSV
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={downloading === "expenses"}
          onClick={() => downloadCsv("expenses")}
        >
          {downloading === "expenses" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-3.5 w-3.5" />
          )}
          Expenses CSV
        </Button>
        <Button size="sm" onClick={onPrint}>
          <Printer className="h-3.5 w-3.5" />
          Print / Save PDF
        </Button>
        <span className="sr-only">
          <Download />
        </span>
      </div>
    </div>
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
