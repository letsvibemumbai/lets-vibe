import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarOff, Clock } from "lucide-react";
import { getScreens } from "@/lib/db/screens.server";
import { formatINR } from "@/components/admin/dashboard/utils";

export const metadata = {
  title: "Screens · Let's Vibe Admin",
  description: "Per-screen pricing, operating hours, and content.",
};
export const dynamic = "force-dynamic";

export default async function AdminScreensPage() {
  const screens = await getScreens();
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header>
        <h1 className="font-display text-4xl text-foreground">Screens</h1>
        <p className="mt-1 text-sm text-foreground/55">
          Per-screen pricing, operating hours, and blocked dates.
        </p>
      </header>

      {screens.length === 0 ? (
        <p className="rounded-2xl bg-amber-50 p-6 text-sm text-amber-800">
          No screens configured. Run <code>npm run seed</code> first.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {screens.map((s) => {
            const blocked = s.blockedDates?.length ?? 0;
            return (
              <Link
                key={s.id}
                href={`/admin/screens/${s.id}`}
                className="group block overflow-hidden rounded-3xl bg-card ring-1 ring-hairline  transition-transform hover:-translate-y-0.5"
              >
                <div className="relative aspect-[4/3] w-full bg-cream">
                  {s.imageUrl ? (
                    <Image
                      src={s.imageUrl}
                      alt={s.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-foreground/40">
                      No image yet
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-display text-2xl text-foreground">
                        {s.name}
                      </h2>
                      <p className="mt-0.5 text-xs uppercase tracking-wider text-foreground/45">
                        {s.theme}
                      </p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 text-foreground/40 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-foreground/65">
                    {s.description}
                  </p>
                  <dl className="mt-4 space-y-1.5 text-xs">
                    <Row
                      icon={<Clock className="h-3 w-3" />}
                      label="Hours"
                      value={`${s.operatingStart}:00 – ${s.operatingEnd}:00`}
                    />
                    <Row
                      label="1h / 2h / 3h"
                      value={`${formatINR(s.basePrices["1h"])} · ${formatINR(s.basePrices["2h"])} · ${formatINR(s.basePrices["3h"])}`}
                    />
                    <Row
                      icon={<CalendarOff className="h-3 w-3" />}
                      label="Blocked"
                      value={`${blocked} ${blocked === 1 ? "date" : "dates"}`}
                    />
                  </dl>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="flex items-center gap-1 text-foreground/50">
        {icon}
        {label}
      </dt>
      <dd className="font-medium text-foreground/80">{value}</dd>
    </div>
  );
}
