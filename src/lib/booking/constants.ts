import { photoUrl, type PhotoKey } from "@/lib/photos";
import type { Screen, ScreenId, ScreenMedia } from "@/types";

export const SCREEN_PRESETS: Record<ScreenId, Screen> = {
  beach: {
    id: "beach",
    name: "The Beach Shack",
    theme: "beach",
    description:
      "Sand textures, warm sundown light, a screen tuned for the slow end of the day. Movie Time priced for two.",
    operatingStart: 9,
    operatingEnd: 21,
    basePrices: { "1h": 999, "2h": 1500, "3h": 1950 },
    imageUrl: "",
  },
  grass: {
    id: "grass",
    name: "Love Den",
    theme: "romantic",
    description:
      "A room built for two — soft seating, intentional lighting, the kind of quiet most date nights don't manage.",
    operatingStart: 9,
    operatingEnd: 21,
    basePrices: { "1h": 999, "2h": 1500, "3h": 1950 },
    imageUrl: "",
  },
  forest: {
    id: "forest",
    name: "Nature Paradise",
    theme: "jungle",
    description:
      "The premium jungle room. Canopy textures, a private jacuzzi, fog effect, and the full Celebration set ready before you arrive.",
    operatingStart: 9,
    operatingEnd: 21,
    basePrices: { "1h": 1950, "2h": 2950, "3h": 3950 },
    imageUrl: "",
  },
};

export const SCREEN_IDS = ["beach", "grass", "forest"] as const;

export function isScreenId(id: string): id is ScreenId {
  return (SCREEN_IDS as readonly string[]).includes(id);
}

export const SCREEN_GRADIENTS: Record<ScreenId, string> = {
  beach: "linear-gradient(135deg, #FFE6B8 0%, #FFC2A1 45%, #F8A1B8 100%)",
  grass: "linear-gradient(135deg, #DCEEC4 0%, #A8D89A 50%, #6BB37A 100%)",
  forest: "linear-gradient(135deg, #BFD7BA 0%, #5C8D6B 55%, #2F5E4B 100%)",
};

/** A screen's media (images + videos) sorted by `order` then id. */
export function orderedScreenMedia(screen: {
  media?: ScreenMedia[];
}): ScreenMedia[] {
  return [...(screen.media ?? [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id.localeCompare(b.id),
  );
}

/**
 * Canonical cover image for a screen on every customer-facing surface: the
 * first admin-uploaded image (by order) when present, else the legacy single
 * `imageUrl`, else the curated themed fallback photo. Keyed off the stable
 * screen id (beach/grass/forest), never the free-form `theme` field, so admins
 * can rename the theme without breaking the fallback art.
 */
export function screenImageUrl(
  screen: { id: ScreenId; imageUrl?: string; media?: ScreenMedia[] },
  width = 1200,
): string {
  const firstImage = orderedScreenMedia(screen).find((m) => m.type === "image");
  if (firstImage) return firstImage.url;
  if (screen.imageUrl) return screen.imageUrl;
  return photoUrl(`screen-${screen.id}` as PhotoKey, width);
}
