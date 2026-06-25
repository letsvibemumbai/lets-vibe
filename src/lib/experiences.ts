import { isExperiencePackage } from "@/lib/booking/addons";
import type { AddonItem, AddonPackage, Screen, ScreenId } from "@/types";

/**
 * Pure helpers for the public-site "Experiences" surfaces (homepage,
 * /screens/[id]). Movie = the plain screening at room price; Celebration =
 * the experience package with decorations included, priced per room.
 */

/** The package to showcase as "the Celebration": first active experience
 * package, else first featured, else the first active one. Null when none. */
export function selectCelebrationPackage(
  packages: AddonPackage[],
): AddonPackage | null {
  const active = packages.filter((p) => p.active);
  return (
    active.find(isExperiencePackage) ??
    active.find((p) => p.featured) ??
    active[0] ??
    null
  );
}

/** "from ₹X" for the Celebration: the cheapest room's surcharge — the base
 * price or any lower per-screen override. */
export function celebrationFromPrice(pkg: AddonPackage): number {
  const overrides = Object.values(pkg.priceByScreen ?? {}).filter(
    (v): v is number => typeof v === "number",
  );
  return Math.min(pkg.price, ...overrides);
}

/** "from ₹X / room" for the Movie experience: cheapest 1-hour room price. */
export function movieFromPrice(screens: Screen[]): number {
  if (screens.length === 0) return 0;
  return Math.min(...screens.map((s) => s.basePrices["1h"]));
}

/** Tag for a screen-restricted add-on, e.g. "Nature Paradise only".
 * Null when the item is offered everywhere. */
export function addonScreenTag(
  item: AddonItem,
  screens: { id: ScreenId; name: string }[],
): string | null {
  if (
    !item.screenIds ||
    item.screenIds.length === 0 ||
    item.screenIds.length >= screens.length
  ) {
    return null;
  }
  const names = item.screenIds.map(
    (id) => screens.find((s) => s.id === id)?.name ?? id,
  );
  return `${names.join(" · ")} only`;
}
