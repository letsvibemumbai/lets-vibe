import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { uploadPublicBlob } from "@/lib/storage/upload";
import { isScreenId } from "@/lib/booking/constants";

export const runtime = "nodejs";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const VIDEO_MAX = 50 * 1024 * 1024; // 50MB

export async function POST(req: NextRequest) {
  await requireAdmin();

  const form = await req.formData();
  const file = form.get("file");
  const screenId = form.get("screenId");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (typeof screenId !== "string" || !isScreenId(screenId)) {
    return NextResponse.json({ error: "Invalid screen" }, { status: 400 });
  }

  const isVideo = VIDEO_TYPES.includes(file.type);
  const isImage = IMAGE_TYPES.includes(file.type);
  if (!isVideo && !isImage) {
    return NextResponse.json(
      { error: "Only JPG/PNG/WebP images or MP4/WebM/MOV videos are allowed." },
      { status: 415 },
    );
  }

  const result = await uploadPublicBlob(file, {
    prefix: `screens/${screenId}`,
    allow: isVideo ? VIDEO_TYPES : IMAGE_TYPES,
    maxBytes: isVideo ? VIDEO_MAX : undefined,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    id: crypto.randomBytes(8).toString("hex"),
    type: isVideo ? "video" : "image",
    url: result.url,
    path: result.path,
  });
}
