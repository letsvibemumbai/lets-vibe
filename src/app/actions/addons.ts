"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import {
  createAddonItem,
  createAddonPackage,
  deleteAddonItem,
  deleteAddonPackage,
  updateAddonItem,
  updateAddonPackage,
} from "@/lib/db/addons.server";

// ---------- shared schema bits ----------

const IdSchema = z.string().trim().min(1);

const ItemInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  description: z.string().trim().max(280).optional(),
  price: z.number().int().min(0, "Price must be 0 or more"),
  category: z.string().trim().max(40).optional(),
  imageUrl: z.string().trim().url().optional().or(z.literal("").transform(() => undefined)),
  maxQuantity: z.number().int().min(1, "Min 1").max(99, "Max 99"),
  // Screens the item is offered on. [] ⇒ all screens.
  screenIds: z.array(z.enum(["beach", "grass", "forest"])).max(3).default([]),
  active: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
});
export type ItemInput = z.infer<typeof ItemInputSchema>;

const PackageInputSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(80),
    description: z.string().trim().max(280).optional(),
    price: z.number().int().min(0, "Price must be 0 or more"),
    imageUrl: z.string().trim().url().optional().or(z.literal("").transform(() => undefined)),
    kind: z.enum(["bundle", "standalone"]),
    itemIds: z.array(IdSchema).default([]),
    // Experience package: shown in the "Choose your experience" selector and
    // blocks à la carte items (they're included).
    includesAddons: z.boolean().default(false),
    // Per-screen price overrides. Explicit keys (not z.record) — zod v4 makes
    // record keys exhaustive, which would reject partial overrides.
    priceByScreen: z
      .object({
        beach: z.number().int().min(0).optional(),
        grass: z.number().int().min(0).optional(),
        forest: z.number().int().min(0).optional(),
      })
      .default({}),
    active: z.boolean(),
    featured: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(9999),
  })
  .refine(
    (v) => v.kind === "standalone" || v.itemIds.length > 0,
    { message: "Bundle packages need at least one item", path: ["itemIds"] },
  );
export type PackageInput = z.infer<typeof PackageInputSchema>;

/**
 * Firestore rejects `undefined` values — keep only the screens that actually
 * have an override. An empty `{}` result is still persisted so stale
 * overrides clear on save.
 */
function definedPriceOverrides(
  priceByScreen: PackageInput["priceByScreen"],
): PackageInput["priceByScreen"] {
  const out: PackageInput["priceByScreen"] = {};
  for (const key of ["beach", "grass", "forest"] as const) {
    const value = priceByScreen[key];
    if (typeof value === "number") out[key] = value;
  }
  return out;
}

// ---------- items ----------

export async function createAddonItemAction(input: unknown): Promise<{ id: string }> {
  await requireAdmin();
  const data = ItemInputSchema.parse(input);
  const id = await createAddonItem(data);
  revalidatePath("/admin/addons");
  return { id };
}

export async function updateAddonItemAction(id: string, input: unknown): Promise<void> {
  await requireAdmin();
  const parsedId = IdSchema.parse(id);
  const data = ItemInputSchema.parse(input);
  await updateAddonItem(parsedId, data);
  revalidatePath("/admin/addons");
  revalidatePath(`/admin/addons/items/${parsedId}`);
}

export async function deleteAddonItemAction(id: string): Promise<void> {
  await requireAdmin();
  const parsedId = IdSchema.parse(id);
  await deleteAddonItem(parsedId);
  revalidatePath("/admin/addons");
}

// ---------- packages ----------

export async function createAddonPackageAction(input: unknown): Promise<{ id: string }> {
  await requireAdmin();
  const data = PackageInputSchema.parse(input);
  // Standalone packages must have empty itemIds to avoid surprises.
  const payload = {
    ...data,
    itemIds: data.kind === "standalone" ? [] : data.itemIds,
    priceByScreen: definedPriceOverrides(data.priceByScreen),
  };
  const id = await createAddonPackage(payload);
  revalidatePath("/admin/addons");
  return { id };
}

export async function updateAddonPackageAction(id: string, input: unknown): Promise<void> {
  await requireAdmin();
  const parsedId = IdSchema.parse(id);
  const data = PackageInputSchema.parse(input);
  const payload = {
    ...data,
    itemIds: data.kind === "standalone" ? [] : data.itemIds,
    priceByScreen: definedPriceOverrides(data.priceByScreen),
  };
  await updateAddonPackage(parsedId, payload);
  revalidatePath("/admin/addons");
  revalidatePath(`/admin/addons/packages/${parsedId}`);
}

export async function deleteAddonPackageAction(id: string): Promise<void> {
  await requireAdmin();
  const parsedId = IdSchema.parse(id);
  await deleteAddonPackage(parsedId);
  revalidatePath("/admin/addons");
}
