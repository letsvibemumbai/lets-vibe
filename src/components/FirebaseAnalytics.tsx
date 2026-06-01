"use client";

import { useEffect } from "react";
import { app } from "@/lib/firebase/client";

// Initializes Firebase Analytics on the client only. getAnalytics() touches
// `window` and would crash during SSR, so we lazy-import inside useEffect.
// No-op when the env var is missing or the browser doesn't support it.
export function FirebaseAnalytics() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) return;
    let cancelled = false;
    (async () => {
      try {
        const mod = await import("firebase/analytics");
        const supported = await mod.isSupported();
        if (!supported || cancelled) return;
        mod.getAnalytics(app);
      } catch {
        // analytics is optional — fail silently
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
