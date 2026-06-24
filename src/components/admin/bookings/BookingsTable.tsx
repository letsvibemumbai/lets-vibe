"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Download, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/dashboard/StatusBadge";
import { SCREEN_LABEL, formatINR } from "@/components/admin/dashboard/utils";
import type { Booking } from "@/types";
import type { BookingListFilters } from "@/lib/db/bookings.server";
import {
  bulkUpdateStatusAction,
  exportBookingsCsvAction,
} from "@/app/actions/admin-bookings";

type Props = {
  rows: Booking[];
  filters: BookingListFilters;
};

export function BookingsTable({ rows, filters }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [exporting, setExporting] = useState(false);

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map((r) => r.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function runBulk(action: "complete" | "cancel") {
    if (selected.size === 0) return;
    startTransition(async () => {
      try {
        const ids = Array.from(selected);
        const { updated } = await bulkUpdateStatusAction(ids, action);
        toast.success(
          `${updated} of ${ids.length} booking${ids.length === 1 ? "" : "s"} updated`,
        );
        setSelected(new Set());
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Bulk update failed");
      }
    });
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const csv = await exportBookingsCsvAction(filters);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `bookings-${stamp}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-foreground/55">
          {selected.size > 0
            ? `${selected.size} selected`
            : `${rows.length} on this page`}
        </p>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => runBulk("complete")}
              >
                {pending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Mark completed
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => runBulk("cancel")}
              >
                {pending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
                Cancel
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={exporting}
            onClick={exportCsv}
          >
            {exporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Export CSV
          </Button>
        </div>
      </div>

      <div className="rounded-3xl bg-card p-2 ring-1 ring-hairline ">
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-hairline-strong bg-cream/40 px-6 py-12 text-center text-sm text-foreground/55">
            No bookings match these filters.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-hairline [&_th]:text-[11px] [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-foreground/45">
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    aria-label="Select all on page"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="size-4 cursor-pointer rounded border-foreground/30"
                  />
                </TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Screen</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((b) => (
                <TableRow
                  key={b.id}
                  data-state={selected.has(b.id) ? "selected" : undefined}
                  className="border-hairline"
                >
                  <TableCell className="w-10">
                    <input
                      type="checkbox"
                      aria-label={`Select booking ${b.id}`}
                      checked={selected.has(b.id)}
                      onChange={() => toggleOne(b.id)}
                      className="size-4 cursor-pointer rounded border-foreground/30"
                    />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {b.date}
                  </TableCell>
                  <TableCell className="text-sm text-foreground/75">
                    {b.startTime}–{b.endTime}
                  </TableCell>
                  <TableCell className="text-sm text-foreground/75">
                    {SCREEN_LABEL[b.screenId]}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {b.customerName}
                  </TableCell>
                  <TableCell className="text-sm text-foreground/75">
                    {b.customerPhone}
                  </TableCell>
                  <TableCell className="text-sm text-foreground/75">
                    {b.duration}h
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground">
                    {formatINR(b.amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={b.status} />
                      {b.paymentStatus === "PENDING" && (
                        <span
                          title="UPI payment screenshot awaiting verification"
                          className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-500/25"
                        >
                          Verify
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-foreground/55 capitalize">
                    {b.source}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="text-xs font-medium text-foreground hover:underline"
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
