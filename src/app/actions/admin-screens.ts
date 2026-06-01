"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { getScreen, updateScreen } from "@/lib/db/screens.server";
import type { ScreenId } from "@/types";

const ScreenIdSchema = z.enum(["beach", "grass", "forest"]);
const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");

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
    blockedDates: z.array(DateSchema).max(366),
  })
  .refine((v) => v.operatingEnd > v.operatingStart, {
    message: "Operating end must be after start",
    path: ["operatingEnd"],
  });

export type ScreenPayload = z.infer<typeof ScreenPayloadSchema>;

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
    blockedDates: dedupedBlocked,
  });

  revalidatePath("/admin/screens");
  revalidatePath(`/admin/screens/${id}`);
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/screens/${id}`);
  revalidatePath("/book");
}
