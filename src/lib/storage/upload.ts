import "server-only";
import crypto from "node:crypto";
import { adminBucket } from "@/lib/firebase/admin";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

export type UploadOptions = {
  prefix: string; // folder, e.g. "expenses" or "screens"
  allow?: string[]; // optional content-type whitelist (subset of ALLOWED)
};

export type UploadResult =
  | { ok: true; url: string; path: string }
  | { ok: false; status: number; error: string };

export async function uploadPublicBlob(
  file: Blob,
  opts: UploadOptions,
): Promise<UploadResult> {
  if (file.size === 0) return { ok: false, status: 400, error: "Empty file" };
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      status: 413,
      error: `File exceeds ${Math.round(MAX_BYTES / 1024 / 1024)}MB`,
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
  await blob.save(buffer, {
    contentType,
    metadata: { cacheControl: "public, max-age=31536000, immutable" },
  });
  await blob.makePublic();
  const url = `https://storage.googleapis.com/${adminBucket.name}/${path}`;
  return { ok: true, url, path };
}
