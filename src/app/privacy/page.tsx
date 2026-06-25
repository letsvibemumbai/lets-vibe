import type { Metadata } from "next";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { PublicShell } from "@/components/site/PublicShell";
import { DisplayHeading, SectionLabel } from "@/components/editorial";

export const metadata: Metadata = {
  title: "Privacy Policy · Let's Vibe",
  description:
    "How Let's Vibe collects, uses, stores, and protects guest information — bookings, ID register, CCTV footage, and payment screenshots.",
  openGraph: {
    title: "Privacy Policy · Let's Vibe",
    description:
      "How Let's Vibe handles guest information, CCTV footage, and payment details.",
  },
};

export default function PrivacyPage() {
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
                    Privacy policy.
                  </DisplayHeading>
                  <p className="mt-6 max-w-2xl text-[15px] leading-[1.7] text-muted">
                    Let&rsquo;s Vibe respects your privacy. This page explains
                    what we collect when you book or visit a private screening,
                    why we collect it, how long we keep it, and the rights you
                    have over it under the{" "}
                    <abbr title="Digital Personal Data Protection Act, 2023">
                      DPDP Act, 2023
                    </abbr>
                    .
                  </p>
                </div>
                <p className="text-[13px] uppercase tracking-[0.22em] text-muted lg:col-span-5">
                  Last updated · {new Date().getFullYear()}
                </p>
              </header>

              <article className="mx-auto mt-20 max-w-3xl divide-y divide-hairline border-y border-hairline">
                <Block title="Who this applies to">
                  Anyone who books a screen at Let&rsquo;s Vibe (online, by
                  phone, or walk-in), visits the premises as a guest of a
                  booking, or uses this website. &ldquo;We&rdquo;, &ldquo;us&rdquo;,
                  and &ldquo;Let&rsquo;s Vibe&rdquo; refer to the operators of
                  the venue.
                </Block>

                <Block title="What we collect">
                  <ul className="list-disc space-y-2 pl-5 text-ink/85">
                    <li>
                      <strong className="text-ink">Booking details</strong> —
                      your name, phone number, email, date, time, screen, and
                      package selected.
                    </li>
                    <li>
                      <strong className="text-ink">ID register</strong> — at
                      check-in we note the type of ID and last four
                      digits/identifier. We do not retain photocopies or scans
                      of your ID.
                    </li>
                    <li>
                      <strong className="text-ink">Payment information</strong>{" "}
                      — UPI reference / transaction ID and any screenshot you
                      upload as proof. We do not store full card or bank
                      account numbers. Online payments are processed by our
                      payment partners under their own policies.
                    </li>
                    <li>
                      <strong className="text-ink">CCTV footage</strong> —
                      every screening room and common area is recorded for
                      safety. Recording is continuous during operating hours.
                    </li>
                    <li>
                      <strong className="text-ink">Account information</strong>{" "}
                      — if you sign in (Google or email) to manage your
                      bookings, we receive your name and email from the
                      sign-in provider.
                    </li>
                    <li>
                      <strong className="text-ink">Communications</strong> —
                      messages, calls, and WhatsApp chats with our team about
                      your booking.
                    </li>
                    <li>
                      <strong className="text-ink">Website usage</strong> —
                      standard analytics (pages visited, device type, approx.
                      location) to keep the site working and improve it.
                    </li>
                  </ul>
                </Block>

                <Block title="Why we collect it">
                  Strictly to run your booking and our venue:
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-ink/85">
                    <li>Confirm the reservation and reach you about it.</li>
                    <li>Verify identity at the door, as required.</li>
                    <li>Reconcile payments and issue refunds where due.</li>
                    <li>
                      Keep the premises and guests safe, and investigate
                      incidents if they happen.
                    </li>
                    <li>Comply with applicable Indian law.</li>
                  </ul>
                </Block>

                <Block title="CCTV — important">
                  All screening rooms and common areas are under CCTV
                  surveillance. By entering the premises you{" "}
                  <strong className="text-ink">consent to being recorded</strong>.
                  Footage is stored on secure on-site/cloud systems with
                  restricted access. We retain footage for a rolling period
                  needed for security (typically{" "}
                  <strong className="text-ink">15–30 days</strong>) and then
                  it is overwritten, unless we are required to preserve a
                  specific clip for an incident, dispute, or legal request.
                  Footage is never sold, shared with third parties for
                  marketing, or published. It will be disclosed only to the
                  guest concerned, our staff with a need to view, or
                  authorities under lawful request.
                </Block>

                <Block title="How long we keep your data">
                  <ul className="list-disc space-y-1 pl-5 text-ink/85">
                    <li>
                      <strong className="text-ink">Booking records</strong>: as
                      long as required for tax and accounting (typically 7
                      years under Indian law), then deleted or anonymised.
                    </li>
                    <li>
                      <strong className="text-ink">Payment screenshots</strong>:
                      kept with the booking record for reconciliation and
                      dispute resolution.
                    </li>
                    <li>
                      <strong className="text-ink">ID register entries</strong>:
                      retained per our register policy for a limited period
                      and then disposed of securely.
                    </li>
                    <li>
                      <strong className="text-ink">CCTV</strong>: 15–30 days
                      rolling, longer only if preserved for a specific reason.
                    </li>
                  </ul>
                </Block>

                <Block title="Who we share it with">
                  We do not sell your personal information. We share only what
                  is necessary, only with:
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-ink/85">
                    <li>
                      <strong className="text-ink">Payment partners</strong>{" "}
                      (e.g. UPI handlers, Razorpay) to process payments and
                      refunds.
                    </li>
                    <li>
                      <strong className="text-ink">Infrastructure providers</strong>{" "}
                      (Firebase / Google Cloud, email, hosting) that store data
                      on our behalf under their own security and privacy
                      controls.
                    </li>
                    <li>
                      <strong className="text-ink">Authorities</strong> when
                      required by law, court order, or lawful request — for
                      example, in the event of an incident on the premises.
                    </li>
                  </ul>
                </Block>

                <Block title="Security">
                  We use industry-standard measures to protect your
                  information: access controls on our admin systems, encrypted
                  storage of payment screenshots, restricted CCTV access, and
                  HTTPS across the website. No system is ever 100% secure — if
                  we become aware of a breach affecting your data, we will
                  notify affected guests as required by law.
                </Block>

                <Block title="Your rights">
                  Under the DPDP Act, 2023 you have the right to:
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-ink/85">
                    <li>Know what personal data we hold about you.</li>
                    <li>Ask us to correct or update it.</li>
                    <li>
                      Ask us to delete it (subject to legal retention
                      requirements).
                    </li>
                    <li>Withdraw any consent you previously gave.</li>
                    <li>
                      Nominate someone to exercise these rights on your behalf
                      in the event of death or incapacity.
                    </li>
                    <li>
                      Lodge a grievance with us, and escalate to the Data
                      Protection Board of India if unresolved.
                    </li>
                  </ul>
                </Block>

                <Block title="Children">
                  We do not knowingly take bookings from minors. Where minors
                  attend a screening, they must be accompanied by an adult
                  guardian who is responsible for them under our Terms.
                </Block>

                <Block title="Cookies">
                  This website uses essential cookies for sign-in and to keep
                  the site working, and limited analytics cookies to measure
                  usage. You can control cookies through your browser
                  settings.
                </Block>

                <Block title="Changes to this policy">
                  We may update this policy from time to time. The version on
                  this page at the time you visit is the one that applies.
                </Block>

                <Block title="Contact &amp; grievances">
                  For any privacy question, request, or grievance — including
                  CCTV access requests for incidents involving you — reach us
                  at:
                  <ul className="mt-3 space-y-1 text-ink/85">
                    <li>
                      Phone /{" "}
                      <a
                        href="tel:+917738819151"
                        className="font-medium text-ink underline-offset-4 hover:underline"
                      >
                        +91 77388 19151
                      </a>
                    </li>
                    <li>WhatsApp · same number</li>
                  </ul>
                  <p className="mt-3">
                    We respond to verified requests within a reasonable time.
                    Please write &ldquo;Privacy request&rdquo; in your message
                    so we can route it correctly.
                  </p>
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
