import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { uploadPublicBlob } from "@/lib/storage/upload";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  await requireAdmin();
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  const result = await uploadPublicBlob(file, { prefix: "expenses" });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ url: result.url, path: result.path });
}
