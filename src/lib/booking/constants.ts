import type { Screen, ScreenId } from "@/types";

export const SCREEN_PRESETS: Record<ScreenId, Screen> = {
  beach: {
    id: "beach",
    name: "Beach Vibes",
    theme: "beach",
    description:
      "Coastal warmth, soft sand textures, and a screen that feels like sunset.",
    operatingStart: 9,
    operatingEnd: 21,
    basePrices: { "1h": 1500, "2h": 2500, "3h": 3500 },
    imageUrl: "",
  },
  grass: {
    id: "grass",
    name: "Grass Garden",
    theme: "grass",
    description:
      "Open-air green for date nights. Pair it with a romantic add-on package.",
    operatingStart: 9,
    operatingEnd: 21,
    basePrices: { "1h": 1800, "2h": 2800, "3h": 3800 },
    imageUrl: "",
  },
  forest: {
    id: "forest",
    name: "Forest Retreat",
    theme: "forest",
    description:
      "Canopy-immersed cocoon for larger groups. The kind of evening that becomes a story.",
    operatingStart: 9,
    operatingEnd: 21,
    basePrices: { "1h": 2000, "2h": 3200, "3h": 4500 },
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
