import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Hero } from "@/components/site/Hero";
import { RomanticSection } from "@/components/site/RomanticSection";
import { ScreenStory } from "@/components/site/ScreenStory";
import { EditorialGallery } from "@/components/site/EditorialGallery";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { HouseRules } from "@/components/site/HouseRules";
import { GsapManifesto } from "@/components/site/GsapManifesto";
import { Magnetic } from "@/components/ui-vibe/Magnetic";
import { AvailabilityChecker } from "@/components/booking/AvailabilityChecker";
import { PublicShell } from "@/components/site/PublicShell";
import {
  DisplayHeading,
  NumberedList,
  PullQuote,
  QuietButton,
  SectionLabel,
} from "@/components/editorial";
import { photoUrl } from "@/lib/photos";

const SCREENS = [
  {
    index: "01",
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
    name: "Grass Garden",
    poeticName: "A room, designed for two.",
    description:
      "Soft, low, intentional. A bench seat for two, fairy lights overhead, the kind of quiet most date nights don't manage. Add the romantic setup if the night calls for it.",
    details: [
      { label: "Capacity", value: "2 – 4 guests" },
      { label: "From", value: "₹1,800 / hour" },
      { label: "Add-on", value: "Romantic setup, ₹800" },
    ],
    photoKey: "screen-grass" as const,
    photoCaption: "Grass Garden — anniversary setup",
    href: "/book/grass",
  },
  {
    index: "03",
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
    title: "Bring your film.",
    body: "Queue up your pick. The room is yours alone the whole time — just the two of you.",
  },
  {
    title: "We'll handle the rest.",
    body: "Projection, sound, ambient lighting, and a quiet, considered handover. You press play.",
  },
];

const PRICES = [
  {
    duration: "01 hour",
    from: "₹1,500",
    note: "Quick, intimate. The film, then home.",
  },
  {
    duration: "02 hours",
    from: "₹2,500",
    note: "A full feature, end to end. Most evenings end here.",
  },
  {
    duration: "03 hours",
    from: "₹3,500",
    note: "Double feature, or one long story. Best for groups.",
  },
];

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
      "We booked the Grass room for an anniversary. The romantic setup was understated in the right way. Lit candles, not a balloon arch.",
    attribution: "Kabir D., November 2024",
  },
];

export default function Home() {
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
                {SCREENS.map((s, i) => (
                  <ScreenStory
                    key={s.name}
                    index={s.index}
                    name={s.name}
                    poeticName={s.poeticName}
                    description={s.description}
                    details={s.details}
                    photoSrc={photoUrl(s.photoKey, 1200)}
                    photoCaption={s.photoCaption}
                    href={s.href}
                    flip={i % 2 === 1}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* ROMANTIC FULL-BLEED */}
          <RomanticSection />

          {/* GSAP pinned "sticky scroll" manifesto */}
          <GsapManifesto />

          {/* HOW IT WORKS */}
          <section id="booking" className="relative py-28 sm:py-36">
            <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
              <header className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-16">
                <div className="lg:col-span-7">
                  <SectionLabel className="mb-6">02 / Booking</SectionLabel>
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
                  <SectionLabel className="mb-6">03 / Pricing</SectionLabel>
                  <DisplayHeading as="h2" size="lg">
                    Time, by the hour.
                  </DisplayHeading>
                </div>
                <p className="text-[15px] leading-[1.7] text-muted lg:col-span-5">
                  Pricing is per room, not per head. Starting prices below — the
                  exact figure depends on which room and which time of day.
                </p>
              </header>

              <ul className="mt-14 divide-y divide-hairline border-y border-hairline sm:mt-20">
                {PRICES.map((p) => (
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
                      from {p.from}
                    </p>
                    <p className="text-[15px] leading-[1.65] text-muted sm:col-span-6">
                      {p.note}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[13px] text-muted">
                  Pricing varies by room. Add-ons available.
                </p>
                <Magnetic strength={0.4}>
                  <QuietButton href="/book" variant="primary" size="md">
                    Reserve
                  </QuietButton>
                </Magnetic>
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
                <Magnetic strength={0.4}>
                  <QuietButton href="/book" variant="primary" size="lg">
                    Book a screen
                  </QuietButton>
                </Magnetic>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </PublicShell>
  );
}
