import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { PublicShell } from "@/components/site/PublicShell";
import {
  DisplayHeading,
  EditorialImage,
  PullQuote,
  QuietButton,
  SectionLabel,
} from "@/components/editorial";
import { TicketButton } from "@/components/ui-vibe/TicketButton";
import { photoUrl } from "@/lib/photos";

export const metadata: Metadata = {
  title: "About · Let's Vibe",
  description:
    "Let's Vibe is a private themed cinema in Satya Nagar, Borivali West, Mumbai — three rooms, your own group, your film, dressed for the occasion if you want it. Your movie. Our space. Your vibe.",
  openGraph: {
    title: "About · Let's Vibe",
    description:
      "A private themed cinema in Satya Nagar, Borivali West, Mumbai. Three rooms, your own group, your film. Your movie. Our space. Your vibe.",
  },
};

const STATS = [
  { value: "03", label: "Private screens" },
  { value: "4K", label: "Projection" },
  { value: "5.1", label: "Dolby sound" },
  { value: "Borivali W.", label: "Mumbai" },
];

export default function AboutPage() {
  return (
    <PublicShell>
      <div className="min-h-screen font-body text-ink">
        <Navbar />
        <main>
          <section>
            <div className="mx-auto max-w-[1280px] px-5 py-28 sm:px-8 sm:py-40 lg:px-12">
              {/* HEADER */}
              <header className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-16">
                <div className="lg:col-span-7">
                  <SectionLabel className="mb-6">About</SectionLabel>
                  <DisplayHeading as="h1" size="lg">
                    A cinema that&rsquo;s yours for the night.
                  </DisplayHeading>
                </div>
                <p className="text-[15px] leading-[1.7] text-muted lg:col-span-5">
                  Let&rsquo;s Vibe is a private themed cinema in Satya Nagar,
                  Borivali West, Mumbai. Three rooms, your own group, your film
                  — and not a single stranger in the dark with you.
                </p>
              </header>

              {/* MANIFESTO */}
              <div className="mx-auto mt-20 max-w-3xl sm:mt-28">
                <p
                  className="font-display text-3xl leading-[1.25] tracking-[-0.01em] text-ink sm:text-4xl md:text-[2.75rem] md:leading-[1.2]"
                  style={{ fontWeight: 300 }}
                >
                  The big multiplex is loud, shared, and built for everyone but
                  you.{" "}
                  <span className="italic text-accent">
                    This is the opposite.
                  </span>{" "}
                  A whole private room, your film, your people — and the room
                  set the way you want it before you walk in.
                </p>
              </div>

              {/* IMAGE — warm hero */}
              <div className="mt-20 sm:mt-28">
                <EditorialImage
                  src={photoUrl("hero-warmth", 1600)}
                  alt="A warm, dimly lit private screening room at Let's Vibe"
                  caption="A room, set before you arrive"
                  aspect="21/9"
                  sizes="(min-width: 1024px) 1280px, 100vw"
                />
              </div>

              {/* STORY BLOCKS */}
              <article className="mx-auto mt-24 max-w-3xl divide-y divide-hairline border-y border-hairline sm:mt-32">
                <Block title="Why we built it">
                  We kept ending up in the same spot — wanting to watch
                  something together without the strangers, the shushing, and
                  the seat someone always kicks. So we made the room we wished
                  existed: a private screen you book for your group only, where
                  the night belongs entirely to you. No queues, no crowd, no
                  compromise. Just{" "}
                  <span className="italic">your movie, our space, your vibe.</span>
                </Block>

                <Block title="Three rooms, three moods">
                  Every screen is a whole private room, scented and scored to
                  its own register. Choose by feeling, not by film.
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-ink/85">
                    <li>
                      <strong className="text-ink">The Beach Shack</strong> —
                      sundown light and soft warmth, tuned for the slow end of
                      the day.
                    </li>
                    <li>
                      <strong className="text-ink">Love Den</strong> — a room
                      built for two: soft seating, intentional lighting, and the
                      quiet most date nights never manage.
                    </li>
                    <li>
                      <strong className="text-ink">Nature Paradise</strong> —
                      our premium jungle room, with a private jacuzzi, fog, and
                      the full Celebration set before you arrive.
                    </li>
                  </ul>
                </Block>

                <Block title="Two ways to watch">
                  Pick the night you want when you book.
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-ink/85">
                    <li>
                      <strong className="text-ink">Movie</strong> — just the
                      private screening. The room, the screen, your film. Priced
                      per room, never per head.
                    </li>
                    <li>
                      <strong className="text-ink">Celebration</strong> — the
                      room dressed before you arrive: cake, balloons, fairy
                      lights, fog, and rose petals in Nature Paradise. Priced
                      per room, set up so you walk straight into the moment.
                    </li>
                  </ul>
                </Block>

                <Block title="How a night works">
                  No app to learn, no fuss at the door.
                  <ol className="mt-4 list-decimal space-y-2 pl-5 text-ink/85">
                    <li>Pick your room — by the mood that fits the night.</li>
                    <li>Choose your time, any day, 10:00 to 22:00.</li>
                    <li>Choose the experience — Movie, or full Celebration.</li>
                    <li>
                      Bring your own film or streaming login; our staff do a
                      quiet handover and step out.
                    </li>
                    <li>Press play. The room is yours.</li>
                  </ol>
                </Block>

                <Block title="The promise">
                  Privacy is the whole point. Your booking is your group only —
                  zero strangers, ever. For everyone&rsquo;s safety the premises
                  are under CCTV; how that footage is handled is set out in our{" "}
                  <Link
                    href="/privacy"
                    className="font-medium text-ink underline-offset-4 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  . We&rsquo;re open every day from{" "}
                  <strong className="text-ink">10:00 to 22:00</strong>, and the
                  staff&rsquo;s job is to disappear once the lights go down.
                </Block>
              </article>

              {/* PULL QUOTE */}
              <div className="mx-auto mt-24 max-w-3xl sm:mt-32">
                <PullQuote attribution="The whole idea, in one line">
                  Your movie. Our space. Your vibe.
                </PullQuote>
              </div>

              {/* STAT ROW */}
              <ul className="mt-24 grid grid-cols-2 divide-hairline border-y border-hairline sm:mt-32 sm:grid-cols-4 sm:divide-x">
                {STATS.map((stat) => (
                  <li
                    key={stat.label}
                    className="flex flex-col gap-2 px-1 py-10 sm:px-8"
                  >
                    <span
                      className="font-display text-4xl leading-none tracking-[-0.02em] text-ink sm:text-5xl"
                      style={{ fontWeight: 300 }}
                    >
                      {stat.value}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.22em] text-muted">
                      {stat.label}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CLOSING CTA */}
              <div className="mt-28 flex flex-col items-start gap-10 sm:mt-40">
                <div className="max-w-2xl">
                  <SectionLabel className="mb-6">Reserve</SectionLabel>
                  <DisplayHeading as="h2" size="md">
                    <span className="font-display italic text-ink">
                      Your night, waiting.
                    </span>
                  </DisplayHeading>
                </div>
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <TicketButton href="/book" size="lg">
                    Reserve a screen
                  </TicketButton>
                  <QuietButton href="/contact" variant="link" size="md">
                    Talk to us
                  </QuietButton>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </PublicShell>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 gap-3 py-10 sm:grid-cols-12 sm:gap-8">
      <h2
        className="font-display text-xl leading-tight text-ink sm:col-span-4 sm:text-2xl"
        style={{ fontWeight: 400 }}
      >
        {title}
      </h2>
      <div className="text-[15px] leading-[1.7] text-muted sm:col-span-8">
        {children}
      </div>
    </section>
  );
}
