import {
  Cake,
  CloudFog,
  Flower2,
  Lightbulb,
  PartyPopper,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/components/ui-vibe";
import { SectionLabel } from "@/components/editorial";
import { addonScreenTag } from "@/lib/experiences";
import type { AddonItem, ScreenId } from "@/types";

/** Icon for an à la carte tile, picked by name keyword. */
function iconFor(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes("cake")) return Cake;
  if (n.includes("balloon")) return PartyPopper;
  if (n.includes("light")) return Lightbulb;
  if (n.includes("fog")) return CloudFog;
  if (n.includes("petal") || n.includes("rose")) return Flower2;
  return Sparkles;
}

type Props = {
  items: AddonItem[];
  screens: { id: ScreenId; name: string }[];
};

/**
 * À la carte rail — the live decoration items, selectable one by one with a
 * Movie booking. Five hairline-divided columns on desktop; a horizontal snap
 * rail on mobile (its own overflow container, so it never fights the page's
 * overflow-x-clip). Renders nothing when the catalogue is empty.
 */
export function AddonsRail({ items, screens }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="mt-16 sm:mt-20">
      <header className="mb-8 sm:mb-10">
        <SectionLabel className="mb-4">À la carte</SectionLabel>
        <h3
          className="font-display text-3xl leading-tight tracking-[-0.01em] text-ink sm:text-4xl"
          style={{ fontWeight: 300 }}
        >
          Add what the night needs.
        </h3>
      </header>

      <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-0 lg:divide-x lg:divide-hairline lg:overflow-visible lg:border-y lg:border-hairline lg:px-0 lg:pb-0">
        {items.map((item) => {
          const Icon = iconFor(item.name);
          const tag = addonScreenTag(item, screens);
          return (
            <Reveal
              key={item.id}
              variant="fade-up"
              className="min-w-[180px] shrink-0 snap-start rounded-sm ring-1 ring-hairline lg:min-w-0 lg:shrink lg:rounded-none lg:ring-0"
            >
              <div className="flex h-full flex-col gap-4 p-5 lg:px-6 lg:py-9">
                <Icon className="h-5 w-5 text-accent" strokeWidth={1.5} />
                <div>
                  <p
                    className="font-display text-xl leading-tight tracking-[-0.01em] text-ink"
                    style={{ fontWeight: 400 }}
                  >
                    {item.name}
                  </p>
                  <p className="mt-1.5 text-[14px] text-muted">
                    ₹{item.price.toLocaleString("en-IN")}
                  </p>
                </div>
                {tag && (
                  <p className="mt-auto text-[10px] uppercase tracking-[0.22em] text-accent">
                    {tag}
                  </p>
                )}
              </div>
            </Reveal>
          );
        })}
      </div>

      <p className="mt-6 font-display text-[15px] italic text-muted">
        Booking the Celebration? Everything above is already in the room.
      </p>
    </div>
  );
}
