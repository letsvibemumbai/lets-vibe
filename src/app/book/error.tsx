"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BookError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[book]", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h1 className="mt-6 font-display text-3xl text-foreground">
        Something went sideways
      </h1>
      <p className="mt-3 text-sm text-foreground/65">
        We couldn&rsquo;t finish that step. Try again, or pick another screen.
      </p>

      <pre className="mt-6 max-w-full overflow-auto rounded-2xl border-3 border-vibe-black bg-white p-4 text-left text-xs leading-relaxed text-vibe-black/80">
        <code>
          {error.name}: {error.message}
          {error.digest ? `\n[digest] ${error.digest}` : ""}
          {error.stack ? `\n\n${error.stack}` : ""}
        </code>
      </pre>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
        <Link
          href="/"
          className="inline-flex h-9 items-center rounded-md px-4 text-sm font-medium text-foreground/65 hover:bg-cream hover:text-foreground"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
