import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Hero } from "@/components/site/Hero";
import { ExperiencesSection } from "@/components/site/ExperiencesSection";
import { ReviewsMarquee } from "@/components/site/ReviewsMarquee";
import { RomanticSection } from "@/components/site/RomanticSection";
import { ScreenStory } from "@/components/site/ScreenStory";
import { EditorialGallery } from "@/components/site/EditorialGallery";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { HouseRules } from "@/components/site/HouseRules";
import { GsapManifesto } from "@/components/site/GsapManifesto";
import { TicketButton } from "@/components/ui-vibe/TicketButton";
import { MarqueeLights } from "@/components/ui-vibe/MarqueeLights";
import { WaterfallText } from "@/components/ui-vibe/WaterfallText";
import { AvailabilityChecker } from "@/components/booking/AvailabilityChecker";
import { PublicShell } from "@/components/site/PublicShell";
import {
  DisplayHeading,
  NumberedList,
  PullQuote,
  QuietButton,
  SectionLabel,
} from "@/components/editorial";
import { getScreensResolved } from "@/lib/db/screens.server";
import { listAddonItems, listAddonPackages } from "@/lib/db/addons.server";
import { screenImageUrl } from "@/lib/booking/constants";
import {
  celebrationFromPrice,
  movieFromPrice,
  selectCelebrationPackage,
} from "@/lib/experiences";
import type { Screen } from "@/types";

export const dynamic = "force-dynamic";

/** Override the editorial "From ₹…/hour" line with the live admin price. */
function withLivePrice(
  details: { label: string; value: string }[],
  live?: Screen,
): { label: string; value: string }[] {
  if (!live) return details;
  return details.map((d) =>
    d.label === "From"
      ? {
          ...d,
          value: `₹${live.basePrices["1h"].toLocaleString("en-IN")} / hour`,
        }
      : d,
  );
}

const SCREENS = [
  {
    index: "01",
    id: "beach" as const,
    name: "Beach Vibes",
    poeticName: "Warm sand, sundown.",
    description:
      "Amber lighting, low rattan, a palette pulled from the last hour of daylight. Built for groups of six to eight who'd rather watch a film in their own room than a noisy multiplex.",
    details: [
      { label: "Capacity", value: "6 – 8 guests" },
      { label: "From", value: "₹1,500 / hour" },
      { label: "Best for", value: "Friends, birthdays" },
    ],
    photoKey: "screen-beach" as const,
    photoCaption: "Beach Vibes — sundown setting",
    href: "/book/beach",
  },
  {
    index: "02",
    id: "grass" as const,
    name: "Grass Garden",
    poeticName: "A room, designed for two.",
    description:
      "Soft, low, intentional. A bench seat for two, fairy lights overhead, the kind of quiet most date nights don't manage. Add the Celebration and walk into a room already glowing.",
    details: [
      { label: "Capacity", value: "2 – 4 guests" },
      { label: "From", value: "₹1,800 / hour" },
      { label: "Best for", value: "Date nights, anniversaries" },
    ],
    photoKey: "screen-grass" as const,
    photoCaption: "Grass Garden — anniversary setup",
    href: "/book/grass",
  },
  {
    index: "03",
    id: "forest" as const,
    name: "Forest Retreat",
    poeticName: "Tall ceilings, a bathtub, a swing.",
    description:
      "The largest of the three rooms. Wood, linen, a clawfoot bathtub in the corner, a swing under the projector. Built for the kind of evening you'll still be talking about next month.",
    details: [
      { label: "Capacity", value: "8 – 12 guests" },
      { label: "From", value: "₹2,000 / hour" },
      { label: "Best for", value: "Groups, milestones" },
    ],
    photoKey: "screen-forest" as const,
    photoCaption: "Forest Retreat — group of eight",
    href: "/book/forest",
  },
];

const STEPS = [
  {
    title: "Choose your room.",
    body: "Three private screens, each tuned to its own mood. Pick the one that fits the night.",
  },
  {
    title: "Choose your time.",
    body: "Hour-by-hour from morning through late evening, every day.",
  },
  {
    title: "Dress the night.",
    body: "Keep it just the film, or go full Celebration — cake, balloons, lights, fog, petals. Or pick add-ons one by one.",
  },
  {
    title: "We'll handle the rest.",
    body: "Projection, sound, ambience, a quiet handover. Queue your film and press play.",
  },
];

/** Pricing rows are derived live from the admin screens — only the editorial
 * framing is fixed here. */
const PRICE_ROWS = [
  {
    key: "1h",
    duration: "01 hour",
    note: "Quick, intimate. The film, then home.",
  },
  {
    key: "2h",
    duration: "02 hours",
    note: "A full feature, end to end. Most evenings end here.",
  },
  {
    key: "3h",
    duration: "03 hours",
    note: "Double feature, or one long story. Best for groups.",
  },
] as const;

const VOICES = [
  {
    text:
      "There's something about renting a whole room that turns a movie into a memory. We've been back four times.",
    attribution: "A. & R., March 2024",
  },
  {
    text:
      "The sound system is genuinely good, the lighting is genuinely thoughtful, and nobody talked through the film. Worth every rupee.",
    attribution: "Meera K., July 2024",
  },
  {
    text:
      "Booked the Celebration for her thirtieth — fog, petals, fairy lights, cake waiting. She still thinks I set it up myself.",
    attribution: "Kabir D., November 2024",
  },
];

export default async function Home() {
  // .catch(() => []) so a Firestore hiccup on the add-on catalogue can never
  // 500 the homepage — the Experiences section degrades to static copy.
  const [liveScreens, addonItems, addonPackages] = await Promise.all([
    getScreensResolved(),
    listAddonItems({ activeOnly: true }).catch(() => []),
    listAddonPackages({ activeOnly: true }).catch(() => []),
  ]);
  const byId = new Map(liveScreens.map((s) => [s.id, s] as const));
  const celebration = selectCelebrationPackage(addonPackages);
  const screenNames = liveScreens.map((s) => ({ id: s.id, name: s.name }));
  const prices = PRICE_ROWS.map((row) => ({
    ...row,
    from: Math.min(...liveScreens.map((s) => s.basePrices[row.key])),
  }));
  return (
    <PublicShell>
      <div className="relative min-h-screen font-body text-ink">
        <Navbar />
        <main className="relative overflow-x-clip">
          {/* HERO */}
          <Hero />

          {/* CHECK AVAILABILITY — quick date/time lookup across all screens */}
          <section
            id="check-availability"
            className="relative border-b border-hairline bg-cream-tonal/20 py-10 sm:py-14"
          >
            <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center lg:gap-12">
                <div className="lg:col-span-3">
                  <DisplayHeading as="h2" size="sm">
                    Free tonight?
                  </DisplayHeading>
                  <p className="mt-2 text-[13px] leading-[1.6] text-muted">
                    Pick a date and time to see which screens are open.
                  </p>
                  <div className="mt-4">
                    <QuietButton href="/book" variant="secondary" size="sm">
                      Browse the rooms
                    </QuietButton>
                  </div>
                </div>
                <div className="lg:col-span-9">
                  <AvailabilityChecker variant="bare" />
                </div>
              </div>
            </div>
          </section>

          {/* SCREENS — vertical alternating */}
          <section
            id="screens"
            className="relative py-24 sm:py-32"
            data-section="screens"
          >
            <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
              <header className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-16">
                <div className="lg:col-span-7">
                  <SectionLabel className="mb-6">01 / Screens</SectionLabel>
                  <DisplayHeading as="h2" size="lg">
                    Three rooms. Three feelings.
                  </DisplayHeading>
                </div>
                <p className="text-[15px] leading-[1.7] text-muted lg:col-span-5">
                  Every screen is a private room — scented, scored, and tuned to
                  its own register. Choose by mood, not by movie.
                </p>
              </header>

              <div className="mt-12 divide-y divide-hairline sm:mt-16">
                {SCREENS.map((s, i) => {
                  const live = byId.get(s.id);
                  return (
                    <ScreenStory
                      key={s.id}
                      index={s.index}
                      name={live?.name ?? s.name}
                      poeticName={s.poeticName}
                      description={live?.description ?? s.description}
                      details={withLivePrice(s.details, live)}
                      photoSrc={screenImageUrl(live ?? { id: s.id }, 1200)}
                      photoCaption={s.photoCaption}
                      href={s.href}
                      flip={i % 2 === 1}
                    />
                  );
                })}
              </div>
            </div>
          </section>

          {/* EXPERIENCES — Movie vs Celebration, plus the à la carte rail */}
          <ExperiencesSection
            movieFrom={movieFromPrice(liveScreens)}
            celebration={celebration}
            celebrationFrom={celebration ? celebrationFromPrice(celebration) : null}
            items={addonItems}
            screens={screenNames}
          />

          {/* NOW SHOWING — cinema marquee band */}
          <MarqueeLights />

          {/* REVIEWS — dark band, two opposite-scroll rows */}
          <section className="dark relative isolate overflow-hidden bg-[#0c0b10] py-20 text-ink sm:py-24">
            <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
              <header>
                <SectionLabel tone="accent" className="mb-6">
                  From the group chat
                </SectionLabel>
                <DisplayHeading as="h2" size="sm">
                  The reviews write themselves.
                </DisplayHeading>
              </header>
            </div>
            <div className="relative mt-12 sm:mt-14">
              {/* edge fades so the tiles dissolve into the band */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0c0b10] to-transparent sm:w-28"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0c0b10] to-transparent sm:w-28"
              />
              <ReviewsMarquee />
            </div>
          </section>

          {/* CELEBRATION FULL-BLEED */}
          <RomanticSection />

          {/* GSAP pinned "sticky scroll" manifesto */}
          <GsapManifesto />

          {/* HOW IT WORKS */}
          <section id="booking" className="relative py-28 sm:py-36">
            <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
              <header className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-16">
                <div className="lg:col-span-7">
                  <SectionLabel className="mb-6">03 / Booking</SectionLabel>
                  <DisplayHeading as="h2" size="lg">
                    How an evening unfolds.
                  </DisplayHeading>
                </div>
                <p className="text-[15px] leading-[1.7] text-muted lg:col-span-5">
                  Reservations take about ninety seconds. The room is held the
                  moment payment confirms.
                </p>
              </header>

              <div className="mt-12 sm:mt-16">
                <NumberedList items={STEPS} />
              </div>
            </div>
          </section>

          {/* GALLERY */}
          <section
            id="experience"
            className="relative py-28 sm:py-36"
          >
            <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
              <header className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-16 sm:mb-16">
                <div className="lg:col-span-7">
                  <SectionLabel className="mb-6">From past evenings</SectionLabel>
                  <DisplayHeading as="h2" size="md">
                    The room before, during, after.
                  </DisplayHeading>
                </div>
                <p className="text-[15px] leading-[1.7] text-muted lg:col-span-5">
                  No staged faces, no stock smiles. Just the rooms, as they were
                  used.
                </p>
              </header>

              <EditorialGallery />
            </div>
          </section>

          {/* HOUSE RULES */}
          <HouseRules />

          {/* PRICING */}
          <section id="pricing" className="relative py-28 sm:py-36">
            <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
              <header className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-16">
                <div className="lg:col-span-7">
                  <SectionLabel className="mb-6">04 / Pricing</SectionLabel>
                  <WaterfallText
                    as="h2"
                    text="Time, by the hour."
                    className="font-display text-5xl leading-[0.98] tracking-[-0.02em] text-ink sm:text-6xl md:text-7xl"
                    style={{ fontWeight: 300 }}
                  />
                </div>
                <p className="text-[15px] leading-[1.7] text-muted lg:col-span-5">
                  Pricing is per room, not per head. Starting prices below — the
                  exact figure depends on which room and which time of day.
                </p>
              </header>

              <ul className="mt-14 divide-y divide-hairline border-y border-hairline sm:mt-20">
                {prices.map((p) => (
                  <li
                    key={p.duration}
                    className="grid grid-cols-1 items-baseline gap-3 py-10 sm:grid-cols-12 sm:gap-8 sm:py-14"
                  >
                    <p
                      className="font-display text-4xl tracking-[-0.02em] text-ink sm:col-span-3 sm:text-5xl md:text-6xl"
                      style={{ fontWeight: 300 }}
                    >
                      {p.duration}
                    </p>
                    <p
                      className="font-display text-2xl tracking-[-0.01em] text-ink sm:col-span-3 sm:text-3xl"
                      style={{ fontWeight: 400 }}
                    >
                      from ₹{p.from.toLocaleString("en-IN")}
                    </p>
                    <p className="text-[15px] leading-[1.65] text-muted sm:col-span-6">
                      {p.note}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[13px] text-muted">
                  Per room, not per head. Celebration and add-ons priced at
                  booking.
                </p>
                <TicketButton href="/book" size="md">
                  Reserve
                </TicketButton>
              </div>
            </div>
          </section>

          {/* VOICES */}
          <section className="relative overflow-hidden py-28 sm:py-36">
            {/* faint warm spotlight so the section reads as a designed space,
                not a flat slab */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60%]"
              style={{
                background:
                  "radial-gradient(60% 100% at 50% 0%, rgba(217,169,76,0.08) 0%, rgba(217,169,76,0) 70%)",
              }}
            />
            <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
              <header className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-16">
                <div className="lg:col-span-7">
                  <SectionLabel tone="accent" className="mb-6">
                    Voices
                  </SectionLabel>
                  <DisplayHeading as="h2" size="md">
                    From a few past evenings.
                  </DisplayHeading>
                </div>
              </header>

              <div className="relative mx-auto mt-16 max-w-3xl sm:mt-20">
                <span
                  aria-hidden
                  className="pointer-events-none absolute -left-2 -top-12 select-none font-display text-[9rem] leading-none text-accent/20 sm:-left-8 sm:-top-16 sm:text-[12rem]"
                >
                  &ldquo;
                </span>
                <div className="relative flex flex-col divide-y divide-hairline">
                  {VOICES.map((v, i) => (
                    <div key={i} className="py-12 first:pt-0 sm:py-16">
                      <PullQuote attribution={v.attribution}>
                        {v.text}
                      </PullQuote>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="relative py-28 sm:py-36">
            <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
              <header className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-16 sm:mb-16">
                <div className="lg:col-span-7">
                  <SectionLabel className="mb-6">Questions</SectionLabel>
                  <DisplayHeading as="h2" size="lg">
                    Things to know.
                  </DisplayHeading>
                </div>
                <p className="text-[15px] leading-[1.7] text-muted lg:col-span-5">
                  Still stuck? The contact page is the fastest way to reach us.
                </p>
              </header>

              <div className="mx-auto max-w-3xl">
                <FaqAccordion />
              </div>
            </div>
          </section>

          {/* FINAL INVITATION */}
          <section className="relative py-40 sm:py-56">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-10 px-5 text-center sm:px-8">
              <SectionLabel>Reserve</SectionLabel>
              <DisplayHeading as="h2" size="lg" className="!leading-[1.02]">
                <span className="font-display italic text-ink">
                  Your night, waiting.
                </span>
              </DisplayHeading>
              <div className="pt-2">
                <TicketButton href="/book" size="lg">
                  Book a screen
                </TicketButton>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </PublicShell>
  );
}
