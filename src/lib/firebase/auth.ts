import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { auth } from "./client";

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
