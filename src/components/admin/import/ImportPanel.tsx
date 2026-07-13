"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/components/admin/dashboard/utils";

type Totals = {
  bookingCount: number;
  roomRevenue: number;
  foodBill: number;
  billed: number;
  advanceCash: number;
  advanceOnline: number;
  balanceCash: number;
  balanceOnline: number;
  collected: number;
  outstanding: number;
  expenseCount: number;
  expensesOut: number;
};

type ImportResult = {
  bookingsAdded: number;
  bookingsSkipped: number;
  expensesAdded: number;
  expensesSkipped: number;
  warnings: string[];
  totals: Totals;
};

export function ImportPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [warningsOpen, setWarningsOpen] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Choose a .xlsx file first");
      return;
    }
    setUploading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/import", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json().catch(() => ({}))) as
        | ImportResult
        | { error?: string };
      if (!res.ok) {
        const msg =
          "error" in data && data.error ? data.error : "Import failed";
        toast.error(msg);
        return;
      }
      const r = data as ImportResult;
      setResult(r);
      toast.success(
        `Imported ${r.bookingsAdded} booking(s) and ${r.expensesAdded} expense(s)`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={onSubmit}
        className="rounded-3xl bg-card p-6 ring-1 ring-hairline"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setResult(null);
          }}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4" />
            {file ? "Choose a different file" : "Choose .xlsx file"}
          </Button>

          {file ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-cream px-3 py-1.5 text-xs text-foreground/80">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              {file.name}
              <button
                type="button"
                aria-label="Remove file"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-foreground/50 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ) : (
            <span className="text-xs text-foreground/55">
              Expects the standard Lets vibe.xlsx layout
            </span>
          )}
        </div>

        <div className="mt-5">
          <Button type="submit" disabled={!file || uploading}>
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Importing…" : "Import"}
          </Button>
        </div>
      </form>

      {result && <ResultCard result={result} warningsOpen={warningsOpen} onToggleWarnings={() => setWarningsOpen((v) => !v)} />}
    </div>
  );
}

function ResultCard({
  result,
  warningsOpen,
  onToggleWarnings,
}: {
  result: ImportResult;
  warningsOpen: boolean;
  onToggleWarnings: () => void;
}) {
  const { totals } = result;
  return (
    <div className="rounded-3xl bg-card p-6 ring-1 ring-hairline space-y-6">
      <div>
        <h2 className="font-display text-2xl text-foreground">Import complete</h2>
        <p className="mt-1 text-sm text-foreground/55">
          Only new rows were inserted. Existing records were left untouched.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Bookings"
          added={result.bookingsAdded}
          skipped={result.bookingsSkipped}
        />
        <StatCard
          label="Expenses"
          added={result.expensesAdded}
          skipped={result.expensesSkipped}
        />
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/60">
          Reconciliation (parsed workbook)
        </h3>
        <div className="overflow-x-auto rounded-2xl ring-1 ring-hairline">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-hairline">
              <Row label="Room revenue" value={formatINR(totals.roomRevenue)} />
              <Row label="Food bill" value={formatINR(totals.foodBill)} />
              <Row label="Billed" value={formatINR(totals.billed)} strong />
              <Row
                label="Collected"
                value={`${formatINR(totals.collected)} (cash ${formatINR(
                  totals.advanceCash + totals.balanceCash,
                )} · online ${formatINR(
                  totals.advanceOnline + totals.balanceOnline,
                )})`}
              />
              <Row label="Outstanding" value={formatINR(totals.outstanding)} strong />
              <Row label="Expenses (out)" value={formatINR(totals.expensesOut)} />
            </tbody>
          </table>
        </div>
      </div>

      {result.warnings.length > 0 && (
        <div>
          <button
            type="button"
            onClick={onToggleWarnings}
            className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-700 ring-1 ring-amber-500/30 hover:bg-amber-500/20"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {result.warnings.length}{" "}
            {result.warnings.length === 1 ? "warning" : "warnings"}
            <span className="text-amber-700/70">
              {warningsOpen ? "Hide" : "Show"}
            </span>
          </button>
          {warningsOpen && (
            <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto rounded-2xl bg-amber-500/5 p-4 text-xs text-amber-800 ring-1 ring-amber-500/20">
              {result.warnings.map((w, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-amber-600">•</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  added,
  skipped,
}: {
  label: string;
  added: number;
  skipped: number;
}) {
  return (
    <div className="rounded-2xl bg-cream p-5 ring-1 ring-hairline">
      <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl text-foreground">
        {added} <span className="text-base font-normal text-foreground/55">added</span>
      </p>
      <p className="mt-1 text-xs text-foreground/55">
        {skipped} already existed (skipped)
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <tr>
      <td className="px-4 py-2.5 text-foreground/70">{label}</td>
      <td
        className={`px-4 py-2.5 text-right tabular-nums ${
          strong ? "font-semibold text-foreground" : "text-foreground/80"
        }`}
      >
        {value}
      </td>
    </tr>
  );
}
