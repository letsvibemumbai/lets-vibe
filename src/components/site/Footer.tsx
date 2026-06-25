import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SectionLabel } from "@/components/editorial";
import { photoUrl, type PhotoKey } from "@/lib/photos";

function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

const IG_FRAMES: PhotoKey[] = [
  "polaroid-1",
  "polaroid-2",
  "polaroid-3",
  "polaroid-4",
  "polaroid-5",
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-cream text-ink">
      {/* Instagram strip — five small squares, hairline frame, no overlay */}
      <div className="border-t border-hairline">
        <div className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
          <div className="flex items-center justify-between gap-4">
            <SectionLabel>@letsvibe.mumbai</SectionLabel>
            <a
              href="#"
              className="text-[11px] uppercase tracking-[0.22em] text-muted transition-colors hover:text-accent"
            >
              Follow →
            </a>
          </div>
          <div className="mt-5 grid grid-cols-5 gap-2 sm:gap-3">
            {IG_FRAMES.map((k) => (
              <a
                key={k}
                href="#"
                className="relative block aspect-square overflow-hidden rounded-sm bg-cream-tonal"
              >
                <Image
                  src={photoUrl(k, 500)}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 200px, 20vw"
                  unoptimized
                  className="object-cover transition-opacity hover:opacity-80 photo-grade"
                />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-hairline">
        <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-10">
            {/* Brand */}
            <div className="md:col-span-4">
              <Logo imgClassName="h-10 w-auto" />
              <p
                className="mt-7 font-display italic text-2xl leading-tight text-ink"
                style={{ fontWeight: 300 }}
              >
                Your movie. Our space. Your vibe.
              </p>
              <p className="mt-5 max-w-sm text-[14px] leading-[1.65] text-muted">
                Three private themed screens in Mumbai. Bring your film — the
                rest of the evening is yours.
              </p>
            </div>

            {/* Visit */}
            <div className="md:col-span-3">
              <SectionLabel>Visit</SectionLabel>
              <ul className="mt-5 space-y-2 text-[14px] text-ink/85">
                <li>Bandra West, Mumbai</li>
                <li className="text-muted">Address coming soon</li>
                <li className="pt-2 text-muted">Daily · 10:00 – 22:00</li>
              </ul>
            </div>

            {/* Contact */}
            <div className="md:col-span-3">
              <SectionLabel>Contact</SectionLabel>
              <ul className="mt-5 space-y-2 text-[14px] text-ink/85">
                <li>
                  <a
                    href="tel:+917738819151"
                    className="transition-colors hover:text-accent"
                  >
                    +91 77388 19151
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:hello@letsvibe.example"
                    className="transition-colors hover:text-accent"
                  >
                    hello@letsvibe.example
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 transition-colors hover:text-accent"
                  >
                    <InstagramGlyph className="h-3.5 w-3.5" />
                    Instagram
                  </a>
                </li>
              </ul>
            </div>

            {/* Fine print */}
            <div className="md:col-span-2">
              <SectionLabel>Fine print</SectionLabel>
              <ul className="mt-5 space-y-2 text-[14px] text-ink/85">
                <li>
                  <Link
                    href="/terms"
                    className="transition-colors hover:text-accent"
                  >
                    Terms
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="transition-colors hover:text-accent"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="transition-colors hover:text-accent"
                  >
                    Refunds
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="transition-colors hover:text-accent"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-16 flex flex-col items-start justify-between gap-3 border-t border-hairline pt-7 text-[11px] uppercase tracking-[0.22em] text-muted sm:flex-row sm:items-center">
            <p>&copy; {year} Let&rsquo;s Vibe</p>
            <p>Made in Mumbai</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
