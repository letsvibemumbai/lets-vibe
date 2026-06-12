import type {
  AddonItem,
  AddonPackage,
  Booking,
  BookingAddonSelection,
  ScreenId,
} from "@/types";

/**
 * Pure add-on/experience rules shared by client components and server actions.
 * One resolver validates and prices selections (per-screen package pricing,
 * screen-restricted items, Movie-vs-Celebration exclusivity) so the customer
 * flow and both admin flows can never drift apart.
 */

/** Whether an item can be booked on a screen. Empty/absent screenIds ⇒ all. */
export function itemAvailableOnScreen(
  item: Pick<AddonItem, "screenIds">,
  screenId: ScreenId,
): boolean {
  return !item.screenIds || item.screenIds.length === 0 || item.screenIds.includes(screenId);
}

/** Package price for a booking: per-screen override when set, else base. */
export function effectivePackagePrice(
  pkg: Pick<AddonPackage, "price" | "priceByScreen">,
  screenId?: ScreenId,
): number {
  if (screenId) {
    const override = pkg.priceByScreen?.[screenId];
    if (typeof override === "number") return override;
  }
  return pkg.price;
}

/** Experience packages ("Celebration") appear in the experience selector and
 * block à la carte items when chosen. */
export function isExperiencePackage(
  pkg: Pick<AddonPackage, "includesAddons">,
): boolean {
  return pkg.includesAddons === true;
}

/**
 * The items a bundle package includes on a given screen — rose petals are
 * listed in Celebration's contents only on the forest room, which also
 * justifies its higher per-screen price there. Standalone packages ⇒ [].
 */
export function packageContentsForScreen(
  pkg: AddonPackage,
  items: AddonItem[],
  screenId?: ScreenId,
): AddonItem[] {
  if (pkg.kind !== "bundle" || pkg.itemIds.length === 0) return [];
  const byId = new Map(items.map((i) => [i.id, i]));
  const contents: AddonItem[] = [];
  for (const id of pkg.itemIds) {
    const item = byId.get(id);
    if (!item) continue;
    if (screenId && !itemAvailableOnScreen(item, screenId)) continue;
    contents.push(item);
  }
  return contents;
}

/** Human label for a booking's experience. Legacy bookings (no flag) ⇒ Movie. */
export function experienceName(
  addOns: Booking["addOns"] | undefined,
): string {
  return addOns?.selections?.find((s) => s.experience)?.name ?? "Movie";
}

/**
 * Adjust a draft's selections after the screen changes (admin offline form):
 * drops items not offered on the new screen (returning their names so the UI
 * can say so) and re-snapshots package prices at the new screen's rate.
 */
export function reconcileSelectionsForScreen(
  selections: BookingAddonSelection[],
  items: AddonItem[],
  packages: AddonPackage[],
  screenId: ScreenId,
): { selections: BookingAddonSelection[]; removed: string[] } {
  const itemById = new Map(items.map((i) => [i.id, i]));
  const pkgById = new Map(packages.map((p) => [p.id, p]));
  const removed: string[] = [];
  const next: BookingAddonSelection[] = [];
  for (const sel of selections) {
    if (sel.kind === "item") {
      const item = itemById.get(sel.id);
      if (item && !itemAvailableOnScreen(item, screenId)) {
        removed.push(sel.name);
        continue;
      }
      next.push(sel);
    } else {
      const pkg = pkgById.get(sel.id);
      next.push(
        pkg ? { ...sel, unitPrice: effectivePackagePrice(pkg, screenId) } : sel,
      );
    }
  }
  return { selections: next, removed };
}

export type SelectionRequestInput = {
  kind: "item" | "package";
  id: string;
  quantity: number;
};

export type ResolveSelectionsOptions = {
  /** Admin paths: accept inactive items/packages (corrections on old bookings). */
  allowInactive?: boolean;
  /** Reject items not offered on the booking's screen. On for the customer
   * flow and offline-create; off for admin edits of legacy bookings. */
  enforceScreenAvailability?: boolean;
};

export type AddonCatalog = {
  getItem: (id: string) => Promise<AddonItem | null>;
  getPackage: (id: string) => Promise<AddonPackage | null>;
};

/**
 * Resolve client-submitted selections against the catalog. Prices are NEVER
 * trusted from the client — each selection snapshots the catalog name and the
 * effective (per-screen) price. Throws coded errors:
 * - `ADDON_ITEM_UNAVAILABLE:{id}` / `ADDON_PACKAGE_UNAVAILABLE:{id}` — missing
 *   or inactive (unless allowInactive).
 * - `ADDON_ITEM_UNAVAILABLE_ON_SCREEN:{id}` — screen-restricted item.
 * - `ADDON_EXPERIENCE_CONFLICT` — two experience packages, or an experience
 *   package mixed with à la carte items (they're already included). Enforced
 *   for admins too: it's incoherent data, not a correction scenario.
 */
export async function resolveSelectionsAgainstCatalog(
  requests: SelectionRequestInput[],
  screenId: ScreenId,
  catalog: AddonCatalog,
  opts: ResolveSelectionsOptions = {},
): Promise<BookingAddonSelection[]> {
  if (requests.length === 0) return [];
  const resolved: BookingAddonSelection[] = [];
  for (const req of requests) {
    if (req.kind === "item") {
      const item = await catalog.getItem(req.id);
      if (!item || (!item.active && !opts.allowInactive)) {
        throw new Error(`ADDON_ITEM_UNAVAILABLE:${req.id}`);
      }
      if (
        opts.enforceScreenAvailability &&
        !itemAvailableOnScreen(item, screenId)
      ) {
        throw new Error(`ADDON_ITEM_UNAVAILABLE_ON_SCREEN:${req.id}`);
      }
      const qty = Math.min(req.quantity, Math.max(1, item.maxQuantity));
      resolved.push({
        kind: "item",
        id: item.id,
        name: item.name,
        unitPrice: item.price,
        quantity: qty,
      });
    } else {
      const pkg = await catalog.getPackage(req.id);
      if (!pkg || (!pkg.active && !opts.allowInactive)) {
        throw new Error(`ADDON_PACKAGE_UNAVAILABLE:${req.id}`);
      }
      resolved.push({
        kind: "package",
        id: pkg.id,
        name: pkg.name,
        unitPrice: effectivePackagePrice(pkg, screenId),
        quantity: 1,
        // Never write `experience: undefined` — Firestore rejects undefined.
        ...(isExperiencePackage(pkg) ? { experience: true } : {}),
      });
    }
  }
  const experiences = resolved.filter((s) => s.experience);
  if (experiences.length > 1) throw new Error("ADDON_EXPERIENCE_CONFLICT");
  if (experiences.length > 0 && resolved.some((s) => s.kind === "item")) {
    throw new Error("ADDON_EXPERIENCE_CONFLICT");
  }
  return resolved;
}
