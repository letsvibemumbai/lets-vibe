import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Your account · Let's Vibe" };

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-cream font-body text-ink">
      <header className="sticky top-0 z-40 border-b border-hairline bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          <Logo imgClassName="h-9 w-auto sm:h-10" />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-ink/65 transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            Back home
          </Link>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-[1100px] px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
        {children}
      </main>
    </div>
  );
}
