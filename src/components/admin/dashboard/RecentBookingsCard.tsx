import Link from "next/link";
import { Receipt } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Booking } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { SCREEN_LABEL, formatINR } from "./utils";

type Props = {
  bookings: Booking[];
};

export function RecentBookingsCard({ bookings }: Props) {
  return (
    <section className="rounded-3xl bg-card p-6 ring-1 ring-hairline ">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-foreground/70" />
          <h2 className="font-display text-2xl">Recent bookings</h2>
        </div>
        <Link
          href="/admin/bookings"
          className="text-xs font-medium text-foreground/55 hover:text-foreground"
        >
          View all →
        </Link>
      </header>

      <div className="mt-4">
        {bookings.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-hairline-strong bg-cream/40 px-6 py-10 text-center text-sm text-foreground/55">
            No bookings yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-hairline [&_th]:text-[11px] [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-foreground/45">
                <TableHead>Customer</TableHead>
                <TableHead>Screen</TableHead>
                <TableHead>Date · Time</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow
                  key={b.id}
                  className="border-hairline hover:bg-cream/50"
                >
                  <TableCell>
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="block"
                    >
                      <span className="font-medium text-foreground">
                        {b.customerName}
                      </span>
                      <span className="block text-xs text-foreground/55">
                        {b.customerPhone}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-foreground/75">
                    {SCREEN_LABEL[b.screenId]}
                  </TableCell>
                  <TableCell className="text-sm text-foreground/75">
                    {b.date}
                    <span className="ml-1 text-foreground/50">
                      · {b.startTime}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground">
                    {formatINR(b.amount)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={b.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </section>
  );
}
