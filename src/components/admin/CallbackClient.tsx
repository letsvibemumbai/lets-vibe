"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { completeSignIn } from "@/lib/firebase/auth";

type State =
  | { kind: "working" }
  | { kind: "error"; message: string };

export function CallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<State>({ kind: "working" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await completeSignIn();
        const idToken = await user.getIdToken(true);
        const res = await fetch("/api/admin/session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "Couldn't create your session.");
        }
        if (cancelled) return;
        const next = searchParams.get("next") ?? "/admin";
        router.replace(next.startsWith("/admin") ? next : "/admin");
      } catch (err) {
        if (cancelled) return;
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "Sign-in failed.",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  if (state.kind === "working") {
    return (
      <div className="flex flex-col items-center text-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground/70" />
        <h2 className="mt-5 font-display text-2xl text-foreground">Signing you in…</h2>
        <p className="mt-2 text-sm text-foreground/55">
          Hold tight — verifying your magic link.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-pink/60">
        <AlertTriangle className="h-6 w-6 text-foreground" />
      </div>
      <h2 className="mt-5 font-display text-2xl text-foreground">Sign-in failed</h2>
      <p className="mt-2 text-sm text-foreground/65">{state.message}</p>
      <Link
        href="/admin/login"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-cream hover:bg-foreground/90"
      >
        Back to sign in <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </div>
  );
}
