import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { createSignedUpload } from "@/lib/storage/upload";
import { isScreenId } from "@/lib/booking/constants";

export const runtime = "nodejs";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const IMAGE_MAX = 15 * 1024 * 1024; // 15MB
const VIDEO_MAX = 200 * 1024 * 1024; // 200MB — direct-to-Storage, no platform body cap

/**
 * Hand the browser a short-lived signed URL to upload a screen photo/video
 * straight to Firebase Storage. This sidesteps the serverless request-body
 * limit (~4.5MB on Vercel) that previously made larger images and all videos
 * fail. The client PUTs the bytes to the returned `uploadUrl`, then calls
 * `/finalize` to make the object public.
 */
export async function POST(req: NextRequest) {
  await requireAdmin();

  let body: { screenId?: unknown; contentType?: unknown; size?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { screenId, contentType, size } = body;
  if (typeof screenId !== "string" || !isScreenId(screenId)) {
    return NextResponse.json({ error: "Invalid screen" }, { status: 400 });
  }
  const isVideo =
    typeof contentType === "string" && VIDEO_TYPES.includes(contentType);
  const isImage =
    typeof contentType === "string" && IMAGE_TYPES.includes(contentType);
  if (!isVideo && !isImage) {
    return NextResponse.json(
      { error: "Only JPG/PNG/WebP images or MP4/WebM/MOV videos are allowed." },
      { status: 415 },
    );
  }
  const max = isVideo ? VIDEO_MAX : IMAGE_MAX;
  if (typeof size === "number" && size > max) {
    return NextResponse.json(
      { error: `File exceeds ${Math.round(max / 1024 / 1024)}MB` },
      { status: 413 },
    );
  }

  try {
    const signed = await createSignedUpload({
      prefix: `screens/${screenId}`,
      contentType: contentType as string,
    });
    return NextResponse.json({ ...signed, type: isVideo ? "video" : "image" });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not start the upload.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
