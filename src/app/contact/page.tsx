import type { Metadata } from "next";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { PublicShell } from "@/components/site/PublicShell";
import { DisplayHeading, SectionLabel } from "@/components/editorial";

export const metadata: Metadata = {
  title: "Contact · Let's Vibe",
  description:
    "Get in touch with Let's Vibe — phone, WhatsApp, email, and address.",
  openGraph: {
    title: "Contact · Let's Vibe",
    description: "Phone, WhatsApp, email, and address for Let's Vibe.",
  },
};

const PHONE_NUMBER = "+91 00000 00000";
const WHATSAPP_URL = "https://wa.me/910000000000";
const EMAIL = "hello@letsvibe.example";

export default function ContactPage() {
  return (
    <PublicShell>
      <div className="min-h-screen font-body text-ink">
        <Navbar />
        <main>
          <section>
            <div className="mx-auto max-w-[1280px] px-5 py-28 sm:px-8 sm:py-40 lg:px-12">
              <header className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-16">
                <div className="lg:col-span-7">
                  <SectionLabel className="mb-6">Contact</SectionLabel>
                  <DisplayHeading as="h1" size="lg">
                    Say hello.
                  </DisplayHeading>
                </div>
                <p className="text-[15px] leading-[1.7] text-muted lg:col-span-5">
                  Booking question, group of twelve, custom add-on — we&rsquo;re
                  listening. WhatsApp is the fastest.
                </p>
              </header>

              <ul className="mt-20 divide-y divide-hairline border-y border-hairline">
                <Entry
                  label="Call"
                  primary={PHONE_NUMBER}
                  hint="Mon – Sun, 10:00 – 22:00"
                  href={`tel:${PHONE_NUMBER.replace(/\s/g, "")}`}
                />
                <Entry
                  label="WhatsApp"
                  primary="Chat with us"
                  hint="Fastest replies"
                  href={WHATSAPP_URL}
                />
                <Entry
                  label="Email"
                  primary={EMAIL}
                  hint="Within a business day"
                  href={`mailto:${EMAIL}`}
                />
                <Entry
                  label="Visit"
                  primary="Satya Nagar, Borivali West"
                  hint="Mumbai · Free parking on site"
                />
              </ul>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </PublicShell>
  );
}

function Entry({
  label,
  primary,
  hint,
  href,
}: {
  label: string;
  primary: string;
  hint: string;
  href?: string;
}) {
  const body = (
    <div className="grid grid-cols-1 items-baseline gap-2 py-8 sm:grid-cols-12 sm:gap-8 sm:py-10">
      <p className="text-[10px] uppercase tracking-[0.22em] text-muted sm:col-span-2">
        {label}
      </p>
      <p
        className="font-display text-3xl leading-none tracking-[-0.01em] text-ink sm:col-span-6 sm:text-4xl"
        style={{ fontWeight: 400 }}
      >
        {primary}
      </p>
      <p className="text-[13px] text-muted sm:col-span-4">{hint}</p>
    </div>
  );
  if (!href) return <li>{body}</li>;
  return (
    <li>
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel="noreferrer"
        className="block transition-colors hover:bg-cream-tonal/50"
      >
        {body}
      </a>
    </li>
  );
}
