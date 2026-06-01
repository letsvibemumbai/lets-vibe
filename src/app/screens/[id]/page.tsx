import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { PublicShell } from "@/components/site/PublicShell";
import {
  DisplayHeading,
  QuietButton,
  SectionLabel,
} from "@/components/editorial";
import { getScreen } from "@/lib/db/screens.server";
import { isScreenId, SCREEN_GRADIENTS } from "@/lib/booking/constants";
import { formatINR } from "@/components/admin/dashboard/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!isScreenId(id)) return { title: "Screen · Let's Vibe" };
  const screen = await getScreen(id);
  if (!screen) return { title: "Screen · Let's Vibe" };
  const title = `${screen.name} · Let's Vibe`;
  return {
    title,
    description: screen.description,
    openGraph: {
      title,
      description: screen.description,
      images: screen.imageUrl ? [{ url: screen.imageUrl }] : undefined,
    },
  };
}

export default async function PublicScreenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isScreenId(id)) notFound();
  const screen = await getScreen(id);
  if (!screen) notFound();

  return (
    <PublicShell>
      <div className="min-h-screen font-body text-ink">
        <Navbar />
        <main>
          <section className="relative">
            <div className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
              <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
                <div
                  className="relative aspect-[4/5] w-full overflow-hidden rounded-sm lg:col-span-7"
                  style={
                    screen.imageUrl
                      ? undefined
                      : { backgroundImage: SCREEN_GRADIENTS[screen.id] }
                  }
                >
                  {screen.imageUrl && (
                    <Image
                      src={screen.imageUrl}
                      alt={screen.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      className="object-cover photo-grade"
                      priority
                      unoptimized
                    />
                  )}
                </div>

                <div className="lg:col-span-5">
                  <SectionLabel className="mb-6">
                    {screen.theme} · Private screen
                  </SectionLabel>
                  <DisplayHeading as="h1" size="lg">
                    {screen.name}.
                  </DisplayHeading>
                  <p
                    className="mt-7 font-display text-xl italic leading-snug text-ink/85 sm:text-2xl"
                    style={{ fontWeight: 300 }}
                  >
                    {screen.description}
                  </p>

                  <dl className="mt-12 divide-y divide-hairline border-y border-hairline text-[13px]">
                    <Stat
                      label="Operating hours"
                      value={`${screen.operatingStart}:00 – ${screen.operatingEnd}:00`}
                    />
                    <Stat
                      label="Starting price"
                      value={formatINR(screen.basePrices["1h"])}
                    />
                    <Stat
                      label="Blocked days"
                      value={`${screen.blockedDates?.length ?? 0}`}
                    />
                  </dl>

                  <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <QuietButton
                      href={`/book/${screen.id}`}
                      variant="primary"
                      size="lg"
                    >
                      Reserve this room
                    </QuietButton>
                    <QuietButton
                      href="/#screens"
                      variant="link"
                      size="md"
                    >
                      Compare rooms
                    </QuietButton>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-cream-tonal">
            <div className="mx-auto max-w-[1280px] px-5 py-24 sm:px-8 sm:py-28 lg:px-12">
              <header className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-16">
                <div className="lg:col-span-7">
                  <SectionLabel className="mb-6">Pricing</SectionLabel>
                  <DisplayHeading as="h2" size="md">
                    By the hour. The room is yours, the whole time.
                  </DisplayHeading>
                </div>
                <p className="text-[15px] leading-[1.7] text-muted lg:col-span-5">
                  Longer slots are better value. Pricing per booking, not per
                  head.
                </p>
              </header>

              <ul className="mt-16 divide-y divide-hairline border-y border-hairline">
                <PriceRow
                  duration="01 hour"
                  price={screen.basePrices["1h"]}
                  blurb="Quick, intimate."
                />
                <PriceRow
                  duration="02 hours"
                  price={screen.basePrices["2h"]}
                  blurb="A full feature, end to end."
                />
                <PriceRow
                  duration="03 hours"
                  price={screen.basePrices["3h"]}
                  blurb="Double feature, or one long story."
                />
              </ul>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </PublicShell>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-4">
      <dt className="text-[10px] uppercase tracking-[0.22em] text-muted">
        {label}
      </dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

function PriceRow({
  duration,
  price,
  blurb,
}: {
  duration: string;
  price: number;
  blurb: string;
}) {
  return (
    <li className="grid grid-cols-1 items-baseline gap-3 py-8 sm:grid-cols-12 sm:gap-8 sm:py-10">
      <p
        className="font-display text-3xl tracking-[-0.02em] text-ink sm:col-span-3 sm:text-4xl"
        style={{ fontWeight: 300 }}
      >
        {duration}
      </p>
      <p
        className="font-display text-xl tracking-[-0.01em] text-ink sm:col-span-3 sm:text-2xl"
        style={{ fontWeight: 400 }}
      >
        {formatINR(price)}
      </p>
      <p className="text-[14px] leading-[1.65] text-muted sm:col-span-6">
        {blurb}
      </p>
    </li>
  );
}
