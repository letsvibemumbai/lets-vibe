/**
 * Curated Unsplash photo IDs for the public site. All IDs verified to return
 * HTTP 200 against images.unsplash.com. Swap freely — change the id and the
 * next/image URL builder picks it up everywhere.
 *
 * URL pattern: https://images.unsplash.com/photo-{id}?w=...&auto=format&fit=crop&q=80
 */

export type PhotoKey =
  | "screen-beach"
  | "screen-grass"
  | "screen-forest"
  | "hero-warmth"
  | "romantic-bleed"
  | "romantic-addon"
  | "polaroid-1"
  | "polaroid-2"
  | "polaroid-3"
  | "polaroid-4"
  | "polaroid-5"
  | "polaroid-6";

const IDS: Record<PhotoKey, string> = {
  // Themed screens — warm, evening-toned
  "screen-beach": "1507525428034-b723cf961d3e",  // beach at sunset, warm tones
  "screen-grass": "1519671482749-fd09be7ccebf",  // fairy lights / garden bokeh
  "screen-forest": "1448375240586-882707db888b", // forest path through trees
  // Hero warm blur (background)
  "hero-warmth": "1489599849927-2ee91cede3ba",   // cinema interior, red glow
  // Romantic full-bleed — fairy lights / warmth
  "romantic-bleed": "1517816743773-6e0fd518b4a6",
  // Romantic add-on inset — soft fairy lights
  "romantic-addon": "1499951360447-b19be8fe80f5",
  // Polaroid gallery — couples / cozy / popcorn / cinema vibes
  "polaroid-1": "1574267432553-4b4628081c31", // couple cozy interior
  "polaroid-2": "1517604931442-7e0c8ed2963c", // popcorn
  "polaroid-3": "1519681393784-d120267933ba", // forest at night with light
  "polaroid-4": "1493804714600-6edb1cd93080", // fairy lights indoor
  "polaroid-5": "1485846234645-a62644f84728", // cinema seats
  "polaroid-6": "1517816743773-6e0fd518b4a6", // sparkler / warm
};

export function photoUrl(key: PhotoKey, width = 1200): string {
  return `https://images.unsplash.com/photo-${IDS[key]}?w=${width}&auto=format&fit=crop&q=80`;
}
