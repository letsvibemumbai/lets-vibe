"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h1 className="mt-6 font-display text-3xl text-foreground">
        Something went wrong
      </h1>
      <p className="mt-3 text-sm text-foreground/65">
        {error.message || "An unexpected error occurred."}
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-foreground/45">
          Reference: <code>{error.digest}</code>
        </p>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset} variant="default">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
        <Link
          href="/admin"
          className="inline-flex h-9 items-center rounded-md px-4 text-sm font-medium text-foreground/65 hover:bg-cream hover:text-foreground"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
