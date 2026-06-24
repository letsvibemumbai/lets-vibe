"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[root]", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-5 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h1 className="mt-6 font-display text-3xl text-foreground">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-sm text-foreground/65">
        We hit an unexpected error. Try again, or head back to the homepage.
        If this keeps happening, mention the reference below when you reach
        out — it helps us trace what went wrong.
      </p>

      {error.digest && (
        <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/45">
          Reference: {error.digest}
        </p>
      )}

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
