# Photography direction — Let's Vibe (V3)

The photography is the most important visual on this site. Typography is restrained on purpose so the images carry the warmth. If a photo looks like generic real-estate stock, the whole page collapses.

---

## Mood — the only filter that matters

We're selling **intimate evenings**, not modern interiors.

- **Lit by candle, lamp, or golden hour.** Never overhead LEDs, never daylight white-balance.
- **Lived-in, not styled.** A glass on a side table, a throw thrown, a half-eaten bowl. Small imperfections add humanity.
- **No bright modern hotel-lobby interiors.** Avoid white walls, glass partitions, polished floors, recessed downlights.
- **Textures over surfaces:** linen, wool, wood grain, brass, faded velvet, an unmade bed, candle wax.
- **No clearly visible faces.** Backs of heads, hands holding glasses, silhouettes, body-only crops. This is for both privacy and intimacy — anonymity lets the viewer project.
- **Shadow is allowed and welcome.** Half-lit faces, dark corners, a single warm key light.

---

## Colour grade — apply uniformly

Every photo on the public site gets the same CSS filter via the `photo-grade` class (defined in `src/app/globals.css`):

```css
.photo-grade {
  filter: saturate(0.95) brightness(0.97) contrast(1.02) sepia(0.05);
}
```

`<EditorialImage>` and the hero photo apply this by default. Don't compose images that already lean orange — the sepia stack will push them too warm. Aim for neutral source files; let the grade do the warming.

Optional inset vignette is wrapped into `<EditorialImage>` via `box-shadow: inset 0 0 120px rgba(26, 22, 18, 0.18)`. Use sparingly outside that component.

---

## Sourcing photos (Unsplash)

When briefing the user or pulling shots, search these queries first — they reliably return the right register:

- `candlelit dinner intimate`
- `cozy cinema room warm`
- `fairy lights bedroom evening`
- `cabin interior warm light`
- `couple silhouette warm`
- `linen sheets golden hour`
- `wine glass candlelight`
- `home theatre warm lamp`
- `private dining room dim lighting`
- `wooden swing interior plants`

Avoid: `home cinema modern`, `luxury living room`, anything tagged `minimalist`, anything in white / cool grey.

---

## Per-screen direction

| Screen | Look | Avoid |
|---|---|---|
| **Beach Vibes** | Amber lighting, sandy palette, low rattan, sundown amber. Tropical without being touristy. | Pool-side resort shots, bright sky, white sand |
| **Grass Garden** | Low ambient lights, fairy-light strands, soft greenery, a bench-seat-for-two. Date-night register. | Wide lawns, daylight, gym lighting |
| **Forest Retreat** | Tall ceilings, wood beams, a clawfoot bathtub, a swing, vintage textures. Larger and cinematic. | Stark modern minimalism, white tile |

---

## Aspect-ratio discipline

The `<EditorialImage>` component accepts `aspect` values: `4/5`, `3/4`, `1/1`, `16/9`, `3/2`, `4/3`, `21/9`. Vary across the page — the gallery alternates intentionally. Never crop a portrait shot to a square if it kills the subject.

---

## Captions

Two short rules:
- Lowercase no-period, **kept under 8 words**.
- Names a moment, not the room: `"anniversary setup"`, `"after-credit conversations"`, `"sundown setting"`. Never `"Beautiful interior shot."`

Caption styling is done by the component — `text-[11px] uppercase tracking-[0.22em] text-muted`.

---

## When uploading a new batch

1. Drop full-resolution originals into `/public/photos/source/`.
2. Optimise / resize via the existing `lib/photos` pipeline (or hand-export at 1800px long edge, AVIF or JPEG ≥ 85%).
3. Register the key in `lib/photos.ts`.
4. Tag with a one-line caption and a per-screen folder, so future swaps don't break the grid.
5. View on a calibrated screen with `f.lux` off. The warm grade adds warmth — judge the photo as it appears in the page, not the raw file.

The single test: does the photo look like a screenshot from a Soho House guest reel, or like a stock photo of a hotel room? If it's the latter, it doesn't ship.
