"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthChange } from "@/lib/firebase/auth";

export type AuthState = {
  /** Firebase user, or null when signed out. */
  user: User | null;
  /** True until Firebase reports the first auth state. */
  loading: boolean;
};

/**
 * Client-side hook subscribing to Firebase auth. Returns `{ user: null,
 * loading: true }` until Firebase initialises, then updates on every change.
 *
 * Use this in customer-facing booking pages. Admin pages use the server
 * `getServerSession()` helper instead.
 */
export function useAuthUser(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    const unsub = onAuthChange((user) => {
      setState({ user, loading: false });
    });
    return unsub;
  }, []);

  return state;
}
