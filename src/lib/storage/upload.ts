import "server-only";
import crypto from "node:crypto";
import { adminBucket } from "@/lib/firebase/admin";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB default (images / PDFs)

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export type UploadOptions = {
  prefix: string; // folder, e.g. "expenses" or "screens"
  allow?: string[]; // optional content-type whitelist (subset of ALLOWED)
  /** Per-call max size override (bytes). Defaults to 5MB. Videos pass a larger
   * cap. */
  maxBytes?: number;
  /**
   * When `true` (default), the blob is made world-readable via `makePublic()`
   * and the returned `url` works for any unauthenticated GET — appropriate for
   * marketing assets (screen images, UPI QR). When `false`, the blob stays
   * private and `url` is still returned for reference but won't resolve
   * without a signed URL — use {@link signedReadUrl} server-side to mint one
   * for an authorized viewer.
   */
  public?: boolean;
};

export type UploadResult =
  | { ok: true; url: string; path: string }
  | { ok: false; status: number; error: string };

export async function uploadPublicBlob(
  file: Blob,
  opts: UploadOptions,
): Promise<UploadResult> {
  if (file.size === 0) return { ok: false, status: 400, error: "Empty file" };
  const maxBytes = opts.maxBytes ?? MAX_BYTES;
  if (file.size > maxBytes) {
    return {
      ok: false,
      status: 413,
      error: `File exceeds ${Math.round(maxBytes / 1024 / 1024)}MB`,
    };
  }
  const contentType = file.type || "application/octet-stream";
  const allowed = opts.allow ?? Object.keys(ALLOWED);
  if (!ALLOWED[contentType] || !allowed.includes(contentType)) {
    return {
      ok: false,
      status: 415,
      error: `Unsupported file type: ${contentType}`,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const id = crypto.randomBytes(12).toString("hex");
  const path = `${opts.prefix}/${id}.${ALLOWED[contentType]}`;
  const blob = adminBucket.file(path);
  const isPublic = opts.public !== false;

  // Wrap the Storage write so a misconfigured bucket / disabled product /
  // permission issue surfaces as a typed result with a useful message instead
  // of becoming an unhandled exception that Next.js renders as a bare 500.
  // The classic case: Firebase Storage has never been provisioned for the
  // project — `blob.save()` then 404s with "The specified bucket does not
  // exist." and the customer sees nothing helpful.
  try {
    await blob.save(buffer, {
      contentType,
      metadata: isPublic
        ? { cacheControl: "public, max-age=31536000, immutable" }
        : { cacheControl: "private, max-age=0, no-store" },
    });
    if (isPublic) await blob.makePublic();
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    console.error("[uploadPublicBlob] storage write failed:", raw);
    const bucketMissing =
      /bucket.*(does not exist|not found)/i.test(raw) ||
      / 404\b/.test(raw);
    return {
      ok: false,
      status: 502,
      error: bucketMissing
        ? "Storage isn't available right now. (The Firebase Storage bucket has not been provisioned — open Firebase Console → Storage → Get started.)"
        : "Storage isn't available right now. Please try again in a moment.",
    };
  }

  const url = `https://storage.googleapis.com/${adminBucket.name}/${path}`;
  return { ok: true, url, path };
}

/**
 * Delete a Storage object by path. Best-effort: a missing object (or a bucket
 * hiccup) resolves without throwing so callers can rewrite their references
 * regardless. Server-only — gate behind `requireAdmin()`.
 */
export async function deleteBlob(path: string): Promise<void> {
  if (!path) return;
  try {
    await adminBucket.file(path).delete({ ignoreNotFound: true });
  } catch (err) {
    console.error("[deleteBlob] failed to delete", path, err);
  }
}

/**
 * Mint a short-lived signed read URL for a private storage object. Server-only
 * — only call from inside `requireAdmin()`-gated server components or admin
 * route handlers. Default TTL 5 min. Returns `null` if the path doesn't exist
 * so the caller can render a graceful fallback.
 */
export async function signedReadUrl(
  path: string,
  ttlMs = 5 * 60_000,
): Promise<string | null> {
  if (!path) return null;
  try {
    const file = adminBucket.file(path);
    const [exists] = await file.exists();
    if (!exists) return null;
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + ttlMs,
    });
    return url;
  } catch {
    return null;
  }
}
