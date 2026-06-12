import Image from "next/image";
import {
  DisplayHeading,
  QuietButton,
  SectionLabel,
} from "@/components/editorial";
import { TicketButton } from "@/components/ui-vibe/TicketButton";
import { AddonsRail } from "@/components/site/AddonsRail";
import { addonScreenTag } from "@/lib/experiences";
import { photoUrl } from "@/lib/photos";
import type { AddonItem, AddonPackage, ScreenId } from "@/types";

type Props = {
  /** Cheapest 1-hour room price — the Movie experience's "from" figure. */
  movieFrom: number;
  /** The live Celebration package, null when the catalogue has none. */
  celebration: AddonPackage | null;
  /** Cheapest per-room Celebration surcharge, null when no package. */
  celebrationFrom: number | null;
  items: AddonItem[];
  screens: { id: ScreenId; name: string }[];
};

/**
 * The two ways to run a night — a plain Movie screening at room price, or the
 * Celebration: same room, decorations already in place, priced per room.
 * Asymmetric duo (quiet cream Movie panel, dominant dark Celebration panel),
 * with the à la carte rail below. Degrades to static copy when the live
 * catalogue is empty.
 */
export function ExperiencesSection({
  movieFrom,
  celebration,
  celebrationFrom,
  items,
  screens,
}: Props) {
  return (
    <section id="experiences" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
        <header className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-16">
          <div className="lg:col-span-7">
            <SectionLabel className="mb-6">02 / Experiences</SectionLabel>
            <DisplayHeading as="h2" size="lg">
              Two ways to run the night.
            </DisplayHeading>
          </div>
          <p className="text-[15px] leading-[1.7] text-muted lg:col-span-5">
            Every booking starts the same — a private room, your film, nobody
            else. The Celebration just means the room is dressed before you
            arrive.
          </p>
        </header>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:mt-16 lg:grid-cols-12">
          {/* THE MOVIE — quiet cream panel */}
          <div className="flex flex-col gap-6 rounded-sm bg-cream p-8 ring-1 ring-hairline sm:p-10 lg:col-span-5">
            <SectionLabel>The Movie</SectionLabel>
            <h3
              className="font-display text-3xl leading-[1.05] tracking-[-0.02em] text-ink sm:text-4xl"
              style={{ fontWeight: 300 }}
            >
              Just you and the film.
            </h3>
            <p className="text-[15px] leading-[1.7] text-muted">
              The room, the projector, Dolby 5.1, and zero strangers. Add cake,
              fog, or balloons à la carte — only if the night calls for it.
            </p>
            <div className="mt-auto flex flex-col items-start gap-6 border-t border-hairline pt-6">
              <p
                className="font-display text-2xl leading-none text-ink"
                style={{ fontWeight: 400 }}
              >
                from ₹{movieFrom.toLocaleString("en-IN")}
                <span className="ml-1 text-sm font-medium text-muted">
                  /room
                </span>
              </p>
              <QuietButton href="/book" variant="secondary" size="md">
                Book a movie night
              </QuietButton>
            </div>
          </div>

          {/* THE CELEBRATION — dominant dark panel, self-scoped */}
          <div className="dark relative isolate overflow-hidden rounded-sm bg-[#08080C] text-ink lg:col-span-7">
            <div aria-hidden className="absolute inset-0 -z-10">
              <Image
                src={photoUrl("romantic-addon", 1400)}
                alt=""
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                unoptimized
                className="object-cover photo-grade"
              />
            </div>
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-gradient-to-b from-[#08080C]/70 via-[#08080C]/55 to-[#08080C]/90"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 shadow-[inset_0_0_200px_rgba(0,0,0,0.7)]"
            />

            <div className="flex h-full flex-col gap-6 p-8 sm:p-10 lg:p-12">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <SectionLabel tone="accent">The Celebration</SectionLabel>
                <span className="inline-flex items-center rounded-sm bg-accent/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.22em] text-accent ring-1 ring-accent/30">
                  Decorations included
                </span>
              </div>
              <h3
                className="font-display text-3xl italic leading-[1.05] text-ink sm:text-4xl md:text-5xl"
                style={{ fontWeight: 400 }}
              >
                Walk into a room that&rsquo;s already celebrating.
              </h3>
              <p className="max-w-xl text-[15px] leading-[1.7] text-ink/80">
                Cake, balloons, fairy lights, fog — and rose petals in the
                Forest. We set it before you arrive. You take the credit.
              </p>

              {items.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {items.map((item) => {
                    const tag = addonScreenTag(item, screens);
                    return (
                      <li
                        key={item.id}
                        className="inline-flex items-baseline gap-2 rounded-full bg-ink/5 px-3 py-1.5 ring-1 ring-hairline"
                      >
                        <span className="text-[12px] text-ink/90">
                          {item.name}
                        </span>
                        {tag && (
                          <span className="text-[10px] uppercase tracking-[0.22em] text-accent/80">
                            {tag}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="mt-auto flex flex-col items-start gap-6 border-t border-hairline pt-6">
                {celebration && celebrationFrom !== null ? (
                  <p
                    className="font-display text-2xl leading-none text-ink"
                    style={{ fontWeight: 400 }}
                  >
                    from ₹{celebrationFrom.toLocaleString("en-IN")}
                    <span className="ml-1 text-sm font-medium text-ink/60">
                      over your room
                    </span>
                  </p>
                ) : (
                  <p
                    className="font-display text-xl italic text-ink/80"
                    style={{ fontWeight: 300 }}
                  >
                    Priced per room at booking.
                  </p>
                )}
                <TicketButton href="/book" size="md">
                  Book the Celebration
                </TicketButton>
              </div>
            </div>
          </div>
        </div>

        <AddonsRail items={items} screens={screens} />
      </div>
    </section>
  );
}
