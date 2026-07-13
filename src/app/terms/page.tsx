import type { Metadata } from "next";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { PublicShell } from "@/components/site/PublicShell";
import { DisplayHeading, SectionLabel } from "@/components/editorial";

export const metadata: Metadata = {
  title: "Terms & Conditions · Let's Vibe",
  description:
    "Terms and conditions for booking a private screening at Let's Vibe — house rules, ID, damages, refunds.",
  openGraph: {
    title: "Terms & Conditions · Let's Vibe",
    description:
      "Terms and conditions for booking a private screening at Let's Vibe.",
  },
};

export default function TermsPage() {
  return (
    <PublicShell>
      <div className="min-h-screen font-body text-ink">
        <Navbar />
        <main>
          <section>
            <div className="mx-auto max-w-[1280px] px-5 py-28 sm:px-8 sm:py-40 lg:px-12">
              <header className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-16">
                <div className="lg:col-span-7">
                  <SectionLabel className="mb-6">Legal</SectionLabel>
                  <DisplayHeading as="h1" size="lg">
                    Terms &amp; conditions.
                  </DisplayHeading>
                  <p className="mt-6 max-w-2xl text-[15px] leading-[1.7] text-muted">
                    Let&rsquo;s Vibe is a private movie-screening theatre in
                    Mumbai with three themed screens — The Beach Shack, Love
                    Den, and Nature Paradise. Booking a screen means you agree
                    to the terms below. Read them before you reserve.
                  </p>
                </div>
                <p className="text-[13px] uppercase tracking-[0.22em] text-muted lg:col-span-5">
                  Last updated · {new Date().getFullYear()}
                </p>
              </header>

              <article className="mx-auto mt-20 max-w-3xl divide-y divide-hairline border-y border-hairline">
                <Block title="Who we are">
                  Let&rsquo;s Vibe is a private movie-screening theatre. We
                  operate three themed screens for guests to use privately,
                  hour by hour:
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-ink/85">
                    <li>
                      <strong className="text-ink">Nature Paradise</strong> —
                      jungle theme, includes a private jacuzzi.
                    </li>
                    <li>
                      <strong className="text-ink">Love Den</strong> — romantic
                      theme.
                    </li>
                    <li>
                      <strong className="text-ink">The Beach Shack</strong> —
                      beach theme.
                    </li>
                  </ul>
                </Block>

                <Block title="Booking">
                  A booking reserves one specific screen for a specific time on
                  a specific date. Bookings are confirmed only after payment is
                  received and verified by our team (UPI / online) or recorded
                  by us for walk-in / phone bookings on{" "}
                  <a
                    href="tel:+917738819151"
                    className="font-medium text-ink underline-offset-4 hover:underline"
                  >
                    +91 77388 19151
                  </a>
                  . An unconfirmed slot is not held.
                </Block>

                <Block title="Valid ID is mandatory">
                  Every guest must show a <strong className="text-ink">valid government photo ID</strong>{" "}
                  at the door (Aadhaar, PAN, Driving Licence, Passport, or
                  Voter ID). We note it in our register only — we do not retain
                  copies. Bookings where ID can&rsquo;t be produced will not be
                  honoured, and the booking amount is forfeited.
                </Block>

                <Block title="Pricing &amp; what's included">
                  <p>
                    All listed package prices are for <strong className="text-ink">two guests</strong>.
                    Each extra guest above two is{" "}
                    <strong className="text-ink">₹300 per person</strong>,
                    payable at check-in.
                  </p>
                  <p className="mt-3">
                    <strong className="text-ink">Movie Time</strong> (The Beach
                    Shack and Love Den): private screening + complimentary
                    hamper (dry snacks, juice, popcorn, mineral water). 1 hour
                    ₹999 · 2 hours ₹1,500 · 3 hours ₹1,950.
                  </p>
                  <p className="mt-3">
                    <strong className="text-ink">Celebration</strong> (Nature
                    Paradise): private screening + complimentary hamper +
                    celebration cake (250g) + LED message tag (birthday /
                    anniversary / Better Together) + walking-on-cloud fog
                    effect + candle setup. 2 hours ₹2,950 · 3 hours ₹3,950.
                  </p>
                </Block>

                <Block title="Outside food, drinks, smoking, alcohol">
                  Outside food and drinks are{" "}
                  <strong className="text-ink">strictly not permitted</strong>{" "}
                  inside any screen. Order anything you like from our private
                  in-room menu. Smoking and alcohol are strictly prohibited
                  anywhere on the premises. Guests found violating this will be
                  asked to leave without refund.
                </Block>

                <Block title="CCTV in every screen">
                  For the safety of all guests and our team, every screen is
                  under <strong className="text-ink">CCTV surveillance</strong>.
                  By entering the premises you consent to being recorded.
                  Footage is retained only as required for security and
                  incident review, and is never shared except where required by
                  law or by lawful order of an authority.
                </Block>

                <Block title="Liability — between guests, between partners">
                  Each screen is a private space rented by you for your slot.
                  Whatever happens between friends, couples, or any persons
                  inside that room is{" "}
                  <strong className="text-ink">
                    entirely the responsibility of the guests inside
                  </strong>
                  . Let&rsquo;s Vibe, its owners, partners, employees, and
                  contractors are{" "}
                  <strong className="text-ink">
                    not liable for any accident, injury, dispute, embarrassment,
                    or loss
                  </strong>{" "}
                  arising from the conduct, decisions, or interactions of
                  guests inside a screen, including but not limited to the
                  jacuzzi at Nature Paradise. You enter and use the room at
                  your own risk.
                </Block>

                <Block title="Jacuzzi (Nature Paradise)">
                  The jacuzzi at Nature Paradise is offered as part of the
                  room. Use it at your own risk. Do not use the jacuzzi if you
                  are pregnant, intoxicated, have a heart condition, blood
                  pressure issues, open wounds, infectious skin conditions, or
                  if a doctor has told you not to. Children must be supervised
                  by an adult at all times. Glass, sharp objects, and
                  electronics are not permitted in or near the jacuzzi.
                </Block>

                <Block title="Damages">
                  The guests in the room are{" "}
                  <strong className="text-ink">liable for any damage</strong>{" "}
                  caused — accidental or otherwise — to the projector, screen,
                  sound system, jacuzzi, fixtures, decor, or any other
                  property. Repair / replacement cost is charged to the
                  primary booking phone number and ID on record. Deliberate
                  damage or theft will additionally be reported to the
                  authorities.
                </Block>

                <Block title="Cancellation &amp; refunds">
                  <p>
                    Cancel <strong className="text-ink">24+ hours before</strong>{" "}
                    your slot for a full refund. Within 24 hours we&rsquo;ll
                    reschedule your booking once at no charge, but the booking
                    amount becomes non-refundable.
                  </p>
                  <p className="mt-3">
                    Refunds for eligible cancellations are processed to the
                    original payment method within 5–10 business days. Bank
                    transfers and international cards may take longer.
                  </p>
                </Block>

                <Block title="No-show">
                  If you don&rsquo;t arrive within{" "}
                  <strong className="text-ink">15 minutes</strong> of your slot
                  start and we can&rsquo;t reach you on the phone provided, the
                  slot is forfeited and the booking amount is non-refundable.
                </Block>

                <Block title="Conduct">
                  Be respectful to our staff and to other guests on the
                  premises. We reserve the right to refuse entry or end a slot
                  early — without refund — for behaviour that is abusive,
                  threatening, intoxicated, illegal, or that endangers any
                  person or property.
                </Block>

                <Block title="Age &amp; content">
                  Minors must be accompanied by an adult who takes
                  responsibility for them. The film, music, or other content
                  you choose to play is your own — you confirm that you have
                  the right to play it, and you are responsible for it being
                  age-appropriate for everyone in the room.
                </Block>

                <Block title="Privacy">
                  How we handle your details — booking info, ID register, CCTV,
                  payment screenshots — is covered in our{" "}
                  <a href="/privacy" className="font-medium text-ink underline-offset-4 hover:underline">
                    Privacy Policy
                  </a>
                  . Please read it.
                </Block>

                <Block title="Changes to these terms">
                  We may update these terms from time to time. The version on
                  this page at the time of your booking is the one that
                  applies.
                </Block>

                <Block title="Contact">
                  Questions or concerns?{" "}
                  <a
                    href="tel:+917738819151"
                    className="font-medium text-ink underline-offset-4 hover:underline"
                  >
                    +91 77388 19151
                  </a>
                  . We&rsquo;re happy to walk you through anything before you
                  book.
                </Block>
              </article>
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
