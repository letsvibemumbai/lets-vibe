import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Only initialize Auth/Firestore in the browser. During `next build` (static
// export / SSR prerender) there is no `window`, and the NEXT_PUBLIC_* env vars
// may be absent — calling getAuth() there throws `auth/invalid-api-key` and
// fails the build (e.g. when prerendering /_not-found). These client services
// are only ever used from client-side effects/handlers, so a browser-only
// init is safe and keeps the build deterministic regardless of env.
const isBrowser = typeof window !== "undefined";

export const auth: Auth = isBrowser
  ? getAuth(app)
  : (undefined as unknown as Auth);
export const db: Firestore = isBrowser
  ? getFirestore(app)
  : (undefined as unknown as Firestore);
export { app };
