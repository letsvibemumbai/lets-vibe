import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { PublicShell } from "@/components/site/PublicShell";
import { DisplayHeading, SectionLabel } from "@/components/editorial";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Everything to know before booking a private screen at Let's Vibe.",
  openGraph: {
    title: "FAQ · Let's Vibe",
    description: "Common questions about booking, screens, add-ons, payments.",
  },
};

export default function FaqPage() {
  return (
    <PublicShell>
      <div className="min-h-screen font-body text-ink">
        <Navbar />
        <main>
          <section>
            <div className="mx-auto max-w-[1280px] px-5 py-28 sm:px-8 sm:py-40 lg:px-12">
              <header className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-16">
                <div className="lg:col-span-7">
                  <SectionLabel className="mb-6">Journal · Questions</SectionLabel>
                  <DisplayHeading as="h1" size="lg">
                    Things to know.
                  </DisplayHeading>
                </div>
                <p className="text-[15px] leading-[1.7] text-muted lg:col-span-5">
                  Still stuck? The{" "}
                  <Link
                    href="/contact"
                    className="underline decoration-accent/50 underline-offset-4 transition-colors hover:text-accent"
                  >
                    contact page
                  </Link>{" "}
                  is the fastest way to reach us.
                </p>
              </header>

              <div className="mx-auto mt-20 max-w-3xl">
                <FaqAccordion />
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </PublicShell>
  );
}
