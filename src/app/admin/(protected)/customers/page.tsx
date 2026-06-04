import Link from "next/link";
import { format, parseISO } from "date-fns";
import { listCustomers } from "@/lib/db/customers.server";

export const metadata = { title: "Customers · Let's Vibe Admin" };
export const dynamic = "force-dynamic";

function fmtDate(d?: string): string {
  if (!d) return "—";
  try {
    return format(parseISO(d), "d MMM yyyy");
  } catch {
    return d;
  }
}

export default async function AdminCustomersPage() {
  const customers = await listCustomers();
  const repeat = customers.filter((c) => c.totalBookings > 1).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
            Tracked by phone
          </span>
          <h1
            className="mt-2 font-display text-4xl leading-none tracking-[-0.01em] text-foreground"
            style={{ fontWeight: 400 }}
          >
            Customers
          </h1>
          <p className="mt-2 text-sm text-foreground/55">
            {customers.length} total · {repeat} repeat
          </p>
        </div>
      </header>

      <section className="rounded-3xl bg-card p-2 ring-1 ring-white/10 sm:p-3">
        {customers.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/12 bg-white/[0.03] px-6 py-12 text-center text-sm text-foreground/55">
            No customers yet. They&rsquo;re created automatically from bookings.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-foreground/45">
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Bookings</th>
                  <th className="px-4 py-3 font-medium">Last booking</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {customers.map((c) => (
                  <tr key={c.id} className="text-foreground/90">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{c.name || "—"}</p>
                      {c.email && (
                        <p className="text-[12px] text-foreground/50">{c.email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{c.phone}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="font-display text-base text-foreground">
                          {c.totalBookings}
                        </span>
                        {c.totalBookings > 1 && (
                          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                            repeat
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground/70">
                      {fmtDate(c.lastBookingDate)}
                    </td>
                    <td className="px-4 py-3 capitalize text-foreground/60">
                      {c.lastSource ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/bookings?q=${encodeURIComponent(c.phone)}`}
                        className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent transition-opacity hover:opacity-80"
                      >
                        View bookings →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
