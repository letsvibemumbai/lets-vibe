import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";
import type { Bucket } from "@google-cloud/storage";

let _app: App | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _bucket: Bucket | null = null;

function ensureApp(): App {
  if (_app) return _app;
  const existing = getApps();
  if (existing.length) {
    _app = existing[0]!;
    return _app;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  const missing: string[] = [];
  if (!projectId) missing.push("FIREBASE_ADMIN_PROJECT_ID");
  if (!clientEmail) missing.push("FIREBASE_ADMIN_CLIENT_EMAIL");
  if (!privateKey) missing.push("FIREBASE_ADMIN_PRIVATE_KEY");
  if (missing.length > 0) {
    throw new Error(
      `Firebase Admin env vars missing: ${missing.join(", ")}. ` +
        `Generate a service account in Firebase console → Project settings → ` +
        `Service accounts → "Generate new private key", then paste the values ` +
        `into .env.local and restart the dev server.`,
    );
  }

  _app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    storageBucket,
  });
  return _app;
}

function realAuth(): Auth {
  return (_auth ??= getAuth(ensureApp()));
}
function realDb(): Firestore {
  if (!_db) {
    _db = getFirestore(ensureApp());
    // Ignore undefined field values instead of throwing. Without this, writing
    // an object with any `undefined` field (e.g. an expense with no receiptUrl)
    // fails with "Cannot use 'undefined' as a Firestore value". settings() can
    // only run once per Firestore instance; the firebase-admin singleton
    // persists across dev HMR (where this module's memo resets), so a repeat
    // call throws "already initialized" — harmless, since the first call's
    // setting persists. Guard it.
    try {
      _db.settings({ ignoreUndefinedProperties: true });
    } catch {
      // Already configured on a previous (pre-HMR) initialization.
    }
  }
  return _db;
}
function realBucket(): Bucket {
  return (_bucket ??= (getStorage(ensureApp()) as Storage).bucket());
}

function lazyProxy<T extends object>(resolver: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      const real = resolver() as unknown as Record<PropertyKey, unknown>;
      const value = real[prop];
      return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(real) : value;
    },
  });
}

export const adminAuth: Auth = lazyProxy(realAuth);
export const adminDb: Firestore = lazyProxy(realDb);
export const adminBucket: Bucket = lazyProxy(realBucket);
