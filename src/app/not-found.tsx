import Link from "next/link";
import { Compass } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 py-20 text-center font-sans text-foreground">
      <Logo imgClassName="h-12 w-auto" />
      <div className="mt-12 flex h-14 w-14 items-center justify-center rounded-full bg-brand-pink/60 text-foreground">
        <Compass className="h-6 w-6" />
      </div>
      <h1 className="mt-6 font-display text-4xl text-foreground sm:text-5xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-sm text-foreground/65">
        The link you followed might be broken, or the page may have moved.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-cream hover:bg-foreground/90"
        >
          Back to home
        </Link>
        <Link
          href="/book"
          className="inline-flex items-center rounded-full bg-brand-yellow px-5 py-2.5 text-sm font-semibold text-foreground hover:brightness-95"
        >
          Book a screen
        </Link>
      </div>
    </div>
  );
}
