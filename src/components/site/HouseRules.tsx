import { SectionLabel } from "@/components/editorial";
import { WaterfallText } from "@/components/ui-vibe/WaterfallText";

type Rule = {
  index: string;
  title: string;
  body: string;
};

const RULES: Rule[] = [
  {
    index: "01",
    title: "No outside food or drink",
    body: "Order anything you like from our private in-room menu. Outside food and drinks aren’t permitted.",
  },
  {
    index: "02",
    title: "No smoking, no alcohol",
    body: "Strictly prohibited inside every screen and across the premises.",
  },
  {
    index: "03",
    title: "CCTV in every room",
    body: "All rooms are under CCTV surveillance, for everyone’s safety. Footage is retained only for security.",
  },
  {
    index: "04",
    title: "Valid ID at check-in",
    body: "Every guest must show a valid government ID at the door. Bookings without ID can’t be honoured.",
  },
  {
    index: "05",
    title: "Two-guest pricing",
    body: "All listed prices are for two. Each extra guest above two is ₹300/person.",
  },
  {
    index: "06",
    title: "You break it, you cover it",
    body: "Whatever happens between friends or partners inside a room is on you — including any damage to projectors, screens, jacuzzi, or other equipment. Damages are billed to the booking.",
  },
];

/**
 * House rules — quiet, non-negotiable policy block. Editorial grid, gold index
 * markers, crisp hairline dividers. Replaces any "bring your own snacks" copy.
 */
export function HouseRules() {
  return (
    <section id="house-rules" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
        <header className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end lg:gap-16">
          <div className="lg:col-span-7">
            <SectionLabel tone="accent" className="mb-5">
              Good to know
            </SectionLabel>
            <WaterfallText
              as="h2"
              text="House rules."
              className="font-display text-5xl leading-[0.98] tracking-[-0.02em] text-ink sm:text-6xl md:text-7xl"
              style={{ fontWeight: 300 }}
            />
          </div>
          <p className="text-[15px] leading-[1.7] text-muted lg:col-span-5">
            A calm, private evening for the two of you. A few simple things keep
            it that way for everyone.
          </p>
        </header>

        <ul className="mt-12 grid grid-cols-1 border-t border-hairline sm:mt-16 sm:grid-cols-2">
          {RULES.map((rule, i) => (
            <li
              key={rule.index}
              className={[
                "flex gap-5 border-b border-hairline py-8 sm:py-10",
                // vertical hairline between the two columns on sm+
                i % 2 === 0 ? "sm:border-r sm:pr-10" : "sm:pl-10",
              ].join(" ")}
            >
              <span className="mt-1 font-display text-sm tracking-[0.1em] text-accent">
                {rule.index}
              </span>
              <div>
                <h3
                  className="font-display text-2xl leading-tight tracking-[-0.01em] text-ink sm:text-3xl"
                  style={{ fontWeight: 400 }}
                >
                  {rule.title}
                </h3>
                <p className="mt-2 text-[14px] leading-[1.65] text-muted">
                  {rule.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
