import {
  GoogleAuthProvider,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { auth } from "./client";

export const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";

const STORAGE_KEY = "letsvibe.signInEmail";

function getActionCodeSettings() {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  return {
    url: `${appUrl}/admin/auth/callback`,
    handleCodeInApp: true,
  };
}

export async function sendAdminMagicLink(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (!ADMIN_EMAIL) {
    throw new Error("NEXT_PUBLIC_ADMIN_EMAIL is not configured");
  }
  if (normalized !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error("This email is not authorized for admin access");
  }
  await sendSignInLinkToEmail(auth, normalized, getActionCodeSettings());
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, normalized);
  }
}

export async function completeSignIn(url?: string): Promise<User> {
  const href = url ?? (typeof window !== "undefined" ? window.location.href : "");
  if (!href || !isSignInWithEmailLink(auth, href)) {
    throw new Error("This link is not a valid sign-in link");
  }
  let email = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
  if (!email && typeof window !== "undefined") {
    email = window.prompt("Please confirm your email to finish signing in") ?? null;
  }
  if (!email) {
    throw new Error("Email required to complete sign-in");
  }
  if (ADMIN_EMAIL && email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error("This email is not authorized for admin access");
  }
  const result = await signInWithEmailLink(auth, email, href);
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return result.user;
}

export async function signOut(): Promise<void> {
  await fbSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Sign in a guest with Google via popup. Used by the customer booking flow
 * (`/book/[id]/auth`). Throws a typed error on `auth/popup-closed-by-user`
 * so the caller can surface a softer message.
 */
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}
