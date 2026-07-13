import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { finalizePublicUpload } from "@/lib/storage/upload";

export const runtime = "nodejs";

/**
 * Called after the browser has PUT a file to the signed URL from `/sign`.
 * Makes the freshly-uploaded object public and returns the media record the
 * client stores on the screen.
 */
export async function POST(req: NextRequest) {
  await requireAdmin();

  let body: { path?: unknown; type?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { path, type } = body;
  if (typeof path !== "string" || !path.startsWith("screens/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const res = await finalizePublicUpload(path);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Upload didn't complete — please try again." },
        { status: 404 },
      );
    }
    return NextResponse.json({
      id: crypto.randomBytes(8).toString("hex"),
      type: type === "video" ? "video" : "image",
      url: res.url,
      path,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Finalize failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
