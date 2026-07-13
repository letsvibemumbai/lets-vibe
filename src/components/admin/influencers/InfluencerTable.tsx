"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AtSign, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InfluencerDialog } from "./InfluencerDialog";
import { formatINR } from "@/components/admin/dashboard/utils";
import { deleteInfluencerAction } from "@/app/actions/admin-influencers";
import type { Influencer, InfluencerPerformance } from "@/types";

type Props = {
  rows: Influencer[];
};

const PERFORMANCE_CHIP: Record<InfluencerPerformance, string> = {
  excellent: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/25",
  good: "bg-amber-500/15 text-amber-700 ring-amber-500/25",
  bad: "bg-rose-500/15 text-rose-700 ring-rose-500/25",
  pending: "bg-slate-500/15 text-slate-600 ring-slate-500/25",
};

function handleWithoutAt(handle: string): string {
  return handle.trim().replace(/^@+/, "");
}

export function InfluencerTable({ rows }: Props) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Influencer | null>(null);
  const [deleting, setDeleting] = useState<Influencer | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();

  function onDelete() {
    if (!deleting) return;
    startDeleteTransition(async () => {
      try {
        await deleteInfluencerAction(deleting.id);
        toast.success("Influencer deleted");
        setDeleting(null);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-foreground/55">
          {rows.length}{" "}
          {rows.length === 1 ? "collaboration" : "collaborations"}
        </p>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add influencer
        </Button>
      </div>

      <div className="rounded-3xl bg-card p-2 ring-1 ring-hairline ">
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-hairline-strong bg-cream/40 px-6 py-12 text-center text-sm text-foreground/55">
            No influencer collaborations yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-hairline [&_th]:text-[11px] [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-foreground/45">
                <TableHead>Name</TableHead>
                <TableHead>IG</TableHead>
                <TableHead>Date of shoot</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reel</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((inf) => {
                const handle = handleWithoutAt(inf.igHandle);
                return (
                  <TableRow key={inf.id} className="border-hairline">
                    <TableCell className="font-medium text-foreground">
                      {inf.name}
                    </TableCell>
                    <TableCell>
                      <a
                        href={`https://instagram.com/${handle}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
                      >
                        <AtSign className="h-3 w-3" />
                        {handle}
                      </a>
                    </TableCell>
                    <TableCell className="text-sm text-foreground/75">
                      {inf.dateOfShoot}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">
                      {formatINR(inf.amount)}
                    </TableCell>
                    <TableCell className="text-xs uppercase tracking-wider text-foreground/55">
                      {inf.paymentMethod}
                    </TableCell>
                    <TableCell>
                      {inf.reelLink ? (
                        <a
                          href={inf.reelLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-foreground hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-xs text-foreground/40">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ring-1 ring-inset ${PERFORMANCE_CHIP[inf.performance]}`}
                      >
                        {inf.performance}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(inf)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground/60 hover:bg-cream hover:text-foreground"
                          aria-label="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(inf)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground/60 hover:bg-rose-50 hover:text-rose-700"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <InfluencerDialog open={addOpen} onOpenChange={setAddOpen} />
      <InfluencerDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        influencer={editing ?? undefined}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this influencer?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.name} · {deleting && formatINR(deleting.amount)}. The
              linked marketing expense will also be removed. This can&rsquo;t be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>
              Keep it
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              disabled={deletePending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deletePending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
