"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "What is the food and drink policy?",
    a: "Outside food and drinks aren’t permitted inside the rooms. Smoking and alcohol are strictly prohibited on the premises. In-room refreshments can be arranged as an add-on at booking.",
  },
  {
    q: "How does cancellation work?",
    a: "Cancel 24+ hours before your slot for a full refund. Inside 24 hours we'll reschedule once at no charge, but the booking amount becomes non-refundable.",
  },
  {
    q: "How many people can come?",
    a: "All package prices are for two. Each extra guest above two is ₹300/person. The Beach Shack and Love Den are tuned for couples and small groups; Nature Paradise is our premium jungle room with a private jacuzzi.",
  },
  {
    q: "What's the Celebration?",
    a: "Cake (250g), an LED message tag (birthday / anniversary / Better Together), walking-on-cloud fog effect, candle setup, plus the complimentary hamper — all set before you walk in. Available at Nature Paradise: ₹1,950 for 1 hour, ₹2,950 for 2 hours, ₹3,950 for 3 hours, for two.",
  },
  {
    q: "What's the Movie Time package?",
    a: "Private screening plus a complimentary hamper (dry snacks, juice, popcorn, mineral water). At The Beach Shack and Love Den: ₹999 / 1 hour, ₹1,500 / 2 hours, ₹1,950 / 3 hours, for two.",
  },
  {
    q: "Do I need to bring an ID?",
    a: "Yes — every guest needs to show a valid government ID at check-in. We note it down for our register; we don't keep a copy.",
  },
  {
    q: "What is the screen quality like?",
    a: "4K projection, surround sound (Dolby 5.1), and ambient lighting tuned per screen theme. The room is yours alone the whole time.",
  },
  {
    q: "Can we bring our own decorations?",
    a: "Yes — balloons, banners, signs are welcome. Nothing that needs to be stapled, glued, or set on fire. Mention it at booking so we can plan setup time — or skip the carrying; every decoration we offer can be added at booking.",
  },
  {
    q: "Is the room private and secure?",
    a: "Completely — the room is yours alone for your whole slot. For everyone’s safety, all rooms are under CCTV surveillance. Smoking and alcohol are strictly prohibited.",
  },
] as const;

export function FaqAccordion() {
  const [openId, setOpenId] = React.useState<string | undefined>(undefined);

  return (
    <Accordion
      type="single"
      collapsible
      value={openId}
      onValueChange={setOpenId}
      className="w-full divide-y divide-hairline border-y border-hairline"
    >
      {FAQS.map((item, i) => {
        const value = `q-${i}`;
        const isOpen = openId === value;
        return (
          <AccordionItem key={item.q} value={value} className="border-b-0">
            <AccordionTrigger
              data-cursor="cta"
              className="group flex items-center gap-6 py-7 text-left transition-colors hover:no-underline [&>svg]:hidden"
            >
              <span
                className="flex-1 font-display text-xl leading-snug text-ink tracking-[-0.01em] sm:text-2xl"
                style={{ fontWeight: 400 }}
              >
                {item.q}
              </span>
              <span
                className="relative inline-flex h-6 w-6 shrink-0 items-center justify-center text-ink/55 transition-colors group-hover:text-accent"
                aria-hidden
              >
                <Plus
                  strokeWidth={1.25}
                  className={
                    "h-5 w-5 transition-transform duration-300 " +
                    (isOpen ? "rotate-45" : "rotate-0")
                  }
                />
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-7 pr-10 text-[15px] leading-[1.7] text-muted">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
