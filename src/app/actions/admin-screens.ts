"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { getScreen, updateScreen } from "@/lib/db/screens.server";
import { deleteBlob } from "@/lib/storage/upload";
import type { ScreenId, ScreenMedia } from "@/types";

const ScreenIdSchema = z.enum(["beach", "grass", "forest"]);
const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");

const ScreenMediaSchema = z.object({
  id: z.string().trim().min(1).max(64),
  type: z.enum(["image", "video"]),
  url: z.string().url(),
  path: z.string().trim().min(1).max(300),
  order: z.number().int().min(0).max(9999),
  caption: z
    .string()
    .trim()
    .max(140)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

const ScreenPayloadSchema = z
  .object({
    name: z.string().trim().min(2).max(60),
    theme: z.string().trim().min(2).max(60),
    description: z.string().trim().min(2).max(500),
    operatingStart: z.number().int().min(0).max(23),
    operatingEnd: z.number().int().min(1).max(24),
    basePrices: z.object({
      "1h": z.number().int().min(0),
      "2h": z.number().int().min(0),
      "3h": z.number().int().min(0),
    }),
    imageUrl: z
      .string()
      .url()
      .optional()
      .or(z.literal("").transform(() => "")),
    media: z.array(ScreenMediaSchema).max(24).optional(),
    blockedDates: z.array(DateSchema).max(366),
  })
  .refine((v) => v.operatingEnd > v.operatingStart, {
    message: "Operating end must be after start",
    path: ["operatingEnd"],
  });

export type ScreenPayload = z.infer<typeof ScreenPayloadSchema>;

function revalidateScreen(id: ScreenId) {
  revalidatePath("/admin/screens");
  revalidatePath(`/admin/screens/${id}`);
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/screens/${id}`);
  revalidatePath("/book");
}

/** Reindex media to sequential order (array position wins) + drop empty captions. */
function normalizeMedia(media: ScreenPayload["media"]): ScreenMedia[] {
  return (media ?? []).map((m, i) => {
    const item: ScreenMedia = {
      id: m.id,
      type: m.type,
      url: m.url,
      path: m.path,
      order: i,
    };
    if (m.caption) item.caption = m.caption;
    return item;
  });
}

export async function updateScreenAction(
  rawId: ScreenId,
  raw: ScreenPayload,
): Promise<void> {
  await requireAdmin();
  const id = ScreenIdSchema.parse(rawId);
  const data = ScreenPayloadSchema.parse(raw);
  const existing = await getScreen(id);
  if (!existing) throw new Error("Screen not found — run `npm run seed`");

  const dedupedBlocked = Array.from(new Set(data.blockedDates)).sort();
  await updateScreen(id, {
    name: data.name,
    theme: data.theme,
    description: data.description,
    operatingStart: data.operatingStart,
    operatingEnd: data.operatingEnd,
    basePrices: data.basePrices,
    imageUrl: data.imageUrl ?? "",
    media: normalizeMedia(data.media),
    blockedDates: dedupedBlocked,
  });

  revalidateScreen(id);
}

/**
 * Remove one media item: delete its Storage blob and rewrite the screen's
 * `media` array. Persisted immediately (independent of the edit form's Save) so
 * a deletion is never left half-done.
 */
export async function removeScreenMediaAction(
  rawId: ScreenId,
  rawMediaId: string,
): Promise<void> {
  await requireAdmin();
  const id = ScreenIdSchema.parse(rawId);
  const mediaId = z.string().trim().min(1).parse(rawMediaId);
  const existing = await getScreen(id);
  if (!existing) throw new Error("Screen not found");

  const target = (existing.media ?? []).find((m) => m.id === mediaId);
  const nextMedia = (existing.media ?? [])
    .filter((m) => m.id !== mediaId)
    .map((m, i) => ({ ...m, order: i }));

  if (target) await deleteBlob(target.path);
  await updateScreen(id, { media: nextMedia });

  revalidateScreen(id);
}
