import type { Metadata } from "next";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { PublicShell } from "@/components/site/PublicShell";
import { DisplayHeading, SectionLabel } from "@/components/editorial";

export const metadata: Metadata = {
  title: "Terms & refunds · Let's Vibe",
  description:
    "Terms of service, cancellation, and refund policy for Let's Vibe.",
  openGraph: {
    title: "Terms & refunds · Let's Vibe",
    description: "Cancellation and refund policy for Let's Vibe bookings.",
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
                    Terms &amp; refunds.
                  </DisplayHeading>
                </div>
                <p className="text-[13px] uppercase tracking-[0.22em] text-muted lg:col-span-5">
                  Last updated · {new Date().getFullYear()}
                </p>
              </header>

              <article className="mx-auto mt-20 max-w-3xl divide-y divide-hairline border-y border-hairline">
                <Block title="Booking">
                  A booking reserves a specific screen for a specific time on
                  a specific date. Bookings are confirmed only after payment
                  is received through our payment partner Razorpay (online) or
                  recorded by our team for walk-in / phone bookings.
                </Block>

                <Block title="Cancellation">
                  You can cancel up to <strong className="text-ink">24 hours</strong>{" "}
                  before your slot for a full refund. Inside 24 hours, we can
                  reschedule your booking once at no charge, but the original
                  amount is non-refundable. Cancellations within 2 hours of
                  the slot are treated as no-shows.
                </Block>

                <Block title="Refunds">
                  Refunds for eligible cancellations are processed via
                  Razorpay to the original payment method within 5–10 business
                  days. We may take longer for bank transfers and
                  international cards.
                </Block>

                <Block title="No-show policy">
                  If you don&rsquo;t arrive within 15 minutes of your slot
                  start and we can&rsquo;t reach you on the phone provided,
                  the slot is forfeited and not refundable.
                </Block>

                <Block title="Outside food &amp; drinks">
                  Outside food and drinks are not permitted inside the rooms.
                  Smoking and alcohol are strictly prohibited anywhere on the
                  premises. In-room refreshments can be arranged as an add-on.
                </Block>

                <Block title="CCTV &amp; safety">
                  For the safety of all guests, every room is under CCTV
                  surveillance. Footage is retained only as needed for security
                  and is never shared except where required by law.
                </Block>

                <Block title="Damage">
                  We trust our guests. If something breaks accidentally, just
                  tell us — we&rsquo;ll work it out. Deliberate damage or
                  theft will be charged to the booking phone number on
                  record.
                </Block>

                <Block title="Privacy">
                  We store the booking details you give us (name, phone,
                  email, date, time) only to operate your booking and contact
                  you about it. We never share customer information with
                  third parties.
                </Block>

                <Block title="Questions">
                  This page isn&rsquo;t legal advice — it&rsquo;s a clear
                  statement of how we run. If anything is unclear, please
                  reach out via the contact page before booking.
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
