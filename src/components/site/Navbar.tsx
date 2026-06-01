"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, User, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { QuietButton } from "@/components/editorial";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/#screens", label: "Screens" },
  { href: "/#experience", label: "Experience" },
  { href: "/#booking", label: "Booking" },
  { href: "/faq", label: "Journal" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-[background-color,backdrop-filter,border-color] duration-300",
        scrolled
          ? "border-b border-hairline bg-cream/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
        <Logo className="shrink-0" imgClassName="text-[1.35rem]" />

        <nav className="hidden items-center gap-9 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-cursor="cta"
              className="group relative text-[11px] font-medium uppercase tracking-[0.22em] text-ink/75 transition-colors hover:text-ink"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-ink transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/account"
            aria-label="Your account"
            data-cursor="cta"
            className="hidden h-10 w-10 items-center justify-center rounded-full text-ink/75 transition-colors hover:bg-ink/5 hover:text-ink md:inline-flex"
          >
            <User className="h-5 w-5" strokeWidth={1.5} />
          </Link>
          <div className="hidden md:block">
            <QuietButton href="/book" variant="primary" size="sm" arrow={false}>
              Reserve
            </QuietButton>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              aria-label="Open menu"
              data-cursor="cta"
              className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-ink transition-colors hover:bg-ink/5 md:hidden"
            >
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full max-w-none border-l-0 bg-cream p-0 sm:w-full"
            >
              <SheetHeader className="flex flex-row items-center justify-between px-6 py-5">
                <SheetTitle asChild>
                  <Logo imgClassName="h-8 w-auto" />
                </SheetTitle>
                <SheetClose
                  aria-label="Close menu"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink"
                >
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </SheetClose>
              </SheetHeader>
              <div className="flex h-[calc(100vh-5rem)] flex-col justify-between px-6 pb-12 pt-8">
                <div className="flex flex-col">
                  {NAV_LINKS.map((link, i) => (
                    <SheetClose asChild key={link.href}>
                      <Link
                        href={link.href}
                        className="border-b border-hairline py-6 font-display text-3xl text-ink"
                        style={{ fontWeight: 300 }}
                      >
                        <span className="mr-3 text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
                          0{i + 1}
                        </span>
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                  <SheetClose asChild>
                    <Link
                      href="/account"
                      className="border-b border-hairline py-6 font-display text-3xl text-ink"
                      style={{ fontWeight: 300 }}
                    >
                      <span className="mr-3 text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
                        0{NAV_LINKS.length + 1}
                      </span>
                      Account
                    </Link>
                  </SheetClose>
                </div>
                <SheetClose asChild>
                  <div className="mt-8">
                    <QuietButton href="/book" variant="primary" size="lg">
                      Reserve a screen
                    </QuietButton>
                  </div>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
