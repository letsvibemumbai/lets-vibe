# Let's Vibe — UI/UX V2 Refinement Prompt

Run this AFTER the v1 sticker overhaul. The v1 nailed the brand but feels like stacked sections. V2 makes it cinematic, romantic, and continuous.

---

## Prompt (paste into Claude Code)

```
The current build looks like a fun sticker collage but it reads as disconnected sections stacked on top of each other. I need three big upgrades:

1. CONTINUOUS FLOW — no visible section breaks; the page should feel like one continuous scroll experience with elements bleeding between sections
2. ROMANTIC LAYER — softer, warmer, more intimate moments between the loud sticker energy. This is a date-night business, not an arcade.
3. BIDIRECTIONAL SCROLL ANIMATIONS — when the user scrolls back up, all animations reverse and play out backwards. This is critical.

Keep the existing sticker primitives and brand colors. We're adding depth and motion sophistication, not throwing out the aesthetic.

---

STEP 1 — Bidirectional scroll animation system

This is the biggest change. Currently animations use Framer Motion's useInView with `once: true` or trigger-and-stay GSAP timelines. Replace this with progress-driven motion so animations reverse on scroll-up.

1. Refactor src/components/ui-vibe/Reveal.tsx:
   - Use Framer Motion's useScroll with target ref and offset ['start 0.9', 'start 0.4']
   - Use useTransform to map scroll progress (0→1) to: opacity, y, scale, rotate
   - Pass through motion.div with the transform values bound to style
   - When user scrolls up, progress decreases, animation visually reverses
   - DO NOT use AnimatePresence or useInView for these

2. Create src/components/ui-vibe/ScrollScene.tsx:
   - Takes a ref to a "scene" container
   - Provides scroll progress context (useScroll on that ref)
   - Children can subscribe via a useScrollScene() hook
   - Multiple elements in a scene can read different ranges of the same progress
   - This lets us choreograph: e.g. as user scrolls through hero, headline lifts up, subhead fades in, background parallaxes, all driven by one progress value
   - Scrolling back reverses the entire choreography

3. Refactor all GSAP timelines that fire on scroll:
   - Replace ScrollTrigger toggleActions of 'play none none none' with 'play reverse play reverse'
   - For SplitText reveals, set scrub: 0.5 so the reveal scrubs with scroll
   - Letters un-reveal when scrolling back up
   - Hero text especially needs this — when scrolling up to hero, letters should ungather

4. Audit every animation in the codebase. Anything that "plays once" needs to be either:
   (a) converted to progress-driven, OR
   (b) explicitly kept one-time and documented why (e.g. confetti burst on success)

Default policy: scroll animations are bidirectional unless they're a one-shot celebration moment.

---

STEP 2 — Eliminate hard section breaks

The site currently reads as Hero | Screens | Packages | How it works | Reviews | FAQ | CTA | Footer with clear visual seams. Fix this by:

1. Single continuous background system:
   - Wrap the entire page in a relative container
   - Behind everything, render a fixed-position background that GRADUALLY shifts color as you scroll
   - Use useScroll on the page root + useTransform on the background gradient
   - Color stops (top → bottom): cream → warm cream → soft pink → deeper pink → cream → warm cream
   - Background also has the noise texture overlay always present
   - No more section-specific background colors — sections are transparent over the gradient

2. Bleeding elements between sections:
   - The last sunburst from hero extends down into the screens section
   - A screen card from the showcase visually crosses into the packages section (negative margin + z-index)
   - Marquee strips don't just sit between sections — they overlap both, with the section above and below visible behind them at the edges
   - Floating stickers drift between sections over scroll (parallax different speeds)

3. Replace abrupt section starts with overlap zones:
   - Each "section" has a top zone that overlaps with the previous section
   - Use negative margins (e.g. -mt-32) and z-indexing
   - The transition between sections happens through visual overlap, not stacking

4. Parallax layers:
   - Hero background spikes scroll at 0.3x speed
   - Floating stickers scroll at 0.6x speed (each sticker can have its own speed)
   - Foreground content scrolls at 1x
   - Use Framer Motion useScroll + useTransform on the y property of each layer
   - Creates depth that ties sections together

5. Section dividers — replace any <hr> or visible boundary with:
   - Diagonal cuts using clip-path that show the next section's content peeking through
   - OR torn-paper edge SVG (sticker-book vibe but as a transition)
   - OR a marquee strip that genuinely overlaps both sections

---

STEP 3 — Add the romantic layer

The site is currently 80% funky 20% romantic. Make it 60/40 with intentional romantic beats woven between the loud moments.

1. Add NEW section between Screens and Packages — "An evening, designed for two."
   - Full-bleed background image (warm-toned, romantic): use a placeholder from Unsplash with query "candlelit dinner intimate warm" or "fairy lights cozy room"
   - Image has a subtle warm color grade overlay (multiply with vibe-pink at 15% opacity)
   - Centered text in display font, smaller and softer than hero: "Some moments deserve their own screen."
   - Subhead in serif italic (add 'Cormorant Garamond' as --font-serif): "Date nights, anniversaries, the random Tuesday you want to feel something. We hold the space, you bring the people."
   - A single small StickerButton "Plan the night →" linking to /book
   - No spikes, no marquees in this section — let it breathe
   - The previous section's marquee strip overlaps the top of this section, then everything else is calm

2. Add a romantic gallery strip between Packages and How it works:
   - Horizontal scrolling row of Polaroid-style photos (real photos from Unsplash, can use these queries):
     * "couple watching movie together cozy"
     * "fairy lights bedroom warm"
     * "popcorn romantic date"
     * "candles flowers intimate"
     * "couple silhouette cinema"
     * "warm blanket sofa cozy"
   - Each photo in a Polaroid frame (white border, sticker shadow, slight rotation)
   - Caveat font caption underneath each like a handwritten note: "movie night 🎬", "her birthday 💕", "just because ✨"
   - Slow auto-scroll, pauses on hover
   - This is purely vibe-setting, no CTAs

3. The Grass Garden screen card gets a romantic micro-section right under it:
   - When user is in the screens area, after the 3 cards, a small inset section appears specifically about the romantic setup
   - Photo of a beautifully decorated romantic setup (Unsplash: "romantic dinner setup rose petals fairy lights")
   - Quote-style text: "The grass screen, but make it magic. Rose petals, fairy lights, the works. +₹800."
   - One small "Add romantic setup →" link

4. Soften the FAQ section:
   - Currently it's loud sticker accordions
   - Add a romantic intro line above: italic serif "We've been asked everything. Here's the honest stuff."
   - Background of FAQ is slightly warmer (dusty pink, not cream)
   - Accordions still sticker-styled but with softer pink

5. Add a single "love note" floating callout that appears mid-scroll:
   - Around the romantic section, a small handwritten-looking sticker note that fades in and gently rotates:
     "psst — book the grass screen with the romantic setup. trust us. 💌"
   - Caveat font, looks like a note someone passed in class
   - Disappears as you scroll past

6. Color temperature shift:
   - In the romantic sections, the noise texture overlay shifts slightly warmer/golden
   - Tie to scroll progress so it's gradual, not a jarring switch

---

STEP 4 — Real photography integration

Currently most "imagery" is illustrated / emoji-based. Add actual photographic warmth.

1. Install: nothing new needed, use next/image with remote Unsplash URLs
   Update next.config.js to add Unsplash to remote image patterns:
   {
     remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }]
   }

2. For each screen card, replace the gradient placeholder with a real themed image:
   - Beach Vibes: Unsplash search "beach setup cinema palm" or use a beach-themed projection setup photo
   - Grass Garden: "garden picnic fairy lights night" 
   - Forest Retreat: "forest cabin bathtub cozy" or "cozy cabin interior"
   - Use specific Unsplash photo IDs (search and pick ones that match the warm romantic palette — not bright daylight, evening/golden hour)
   - Image fills 60% of the card, themed overlay (multiply with the screen's accent color at 20%)
   - Black border + sticker shadow stays — the sticker frame around real photos is what makes it work

3. Hero: add a subtle blurred photo behind everything:
   - A warm out-of-focus photo of a cinema/projection setup at very low opacity (15-20%)
   - Positioned behind the sunburst spikes
   - Tints the entire hero with warmth without competing for attention

4. The "evening designed for two" section uses a real full-bleed romantic photo as discussed in Step 3.

5. Reviews marquee: each review card now has a small circular profile photo (use Unsplash "portrait" with random IDs, or use placeholder avatar generators like dicebear)

6. How it works steps: keep the emoji but add a small subtle photographic background to each step card (very low opacity, themed to the step — e.g. step 4 "Vibe out" has a blurred cinema-room photo behind it)

Important: photos must be EDITED via CSS filters to match the warm pink/yellow palette. Apply:
- filter: saturate(1.1) brightness(0.95) contrast(1.05)
- Or a subtle warm overlay div with mix-blend-mode: multiply and the vibe-pink-soft color at 10-15%

Don't let stock photos look like stock photos. Tint them, frame them, and integrate them with stickers.

---

STEP 5 — Cinematic scroll moments

Add 2-3 "wow" scroll moments that make the site feel premium:

1. Hero exit moment:
   - As user scrolls down from hero, the headline letters don't just fade out
   - Each line rotates and slides out in a different direction (line 1 left, line 2 right, line 3 up)
   - The sunburst spikes shrink and rotate as if collapsing into a point
   - All driven by scroll progress, fully reversible on scroll-up
   - Use Framer Motion useTransform with multiple inputs

2. Screen card "stack and fan" moment:
   - When the screens section enters viewport, the 3 cards start stacked on top of each other in the center
   - As user scrolls, they fan out to their final positions (left, center, right) with rotation
   - Driven by scroll progress — scrubbing back up restacks them
   - This is the visual centerpiece of the screens section

3. Marquee speed reactivity:
   - The marquee strips' scroll speed is tied to page scroll velocity
   - Fast scroll = marquees speed up
   - Stop scrolling = marquees return to base speed
   - Use Framer Motion useVelocity + useSpring

4. Letter-by-letter intro at the romantic section:
   - The "Some moments deserve their own screen" line draws in character by character as user scrolls through it
   - Scrubbed with scroll, so scrolling back un-draws it

---

STEP 6 — Section-by-section flow audit

Walk through the page top to bottom and verify zero hard breaks. Specifically:

1. Hero → Screens: 
   - Hero's sunburst spike extends past the hero's "end" 
   - A floating sticker drifts from hero down into screens
   - Background gradient is mid-transition (cream → warm pink shifting)
   - Marquee strip overlaps both sections

2. Screens → Romantic intro:
   - The grass screen card's romantic add-on badge extends visually below the cards row
   - Background gradient continues shifting
   - The romantic intro section starts with no top border, just a subtle vignette darkening

3. Romantic intro → Packages:
   - The romantic photo's edges blur out into the packages section
   - A handwritten "psst" note floats across the boundary
   - Packages section begins with the heading peeking into the romantic section above

4. Packages → Polaroid gallery:
   - The most-popular sticker badge on the 2-hour package extends downward
   - Polaroid gallery starts with photos slightly overlapping the packages row

5. Polaroid gallery → How it works:
   - Last polaroid rotates out
   - First how-it-works step rotates in from above
   - Overlap zone with both visible

6. How it works → Reviews:
   - Step 4's "✨" emoji becomes a floating sticker that drifts into the reviews section
   - Background pink intensifies slightly

7. Reviews → FAQ:
   - One review card from the marquee detaches and floats into the FAQ background as a "we get asked this a lot" note
   - Smooth gradient continuation

8. FAQ → Final CTA:
   - FAQ background's dusty pink deepens into the CTA's full pink
   - No hard line, just gradient
   - SunburstSpikes from CTA peek up into FAQ's bottom

9. CTA → Footer:
   - The bottom of the CTA section is "torn" with a diagonal clip-path
   - Footer's black bleeds up through the tear

Every transition should feel like one continuous canvas. If you can identify where a section "starts" or "ends" by looking at it, that's a fail — fix it.

---

STEP 7 — Mobile considerations

All the above is heavier than v1. Mobile needs surgical reductions:

1. Disable the stack-and-fan screen card moment on mobile (just show cards in normal column)
2. Reduce parallax layers to just one (background only)
3. Polaroid gallery becomes a regular vertical stack of 3-4 photos (not all)
4. Disable Lenis smooth scroll on mobile (already off if v1 done right)
5. Reduce floating stickers count by 60%
6. Keep bidirectional scroll animations — those are cheap
7. The "evening designed for two" section keeps its full-bleed photo but text becomes left-aligned and smaller
8. Marquees stay (they're cheap and add a lot of vibe)

Test on iPhone SE viewport. Frame rate should stay above 50fps during scroll.

---

STEP 8 — Final tweaks

1. Add a scroll progress indicator at the very top of the page — a thin pink line that fills left-to-right as you scroll. Subtle, 2px tall.

2. The custom cursor: when over the romantic section, cursor turns into a small heart shape (or has a heart trailing it). When over screens, it's pink. Over CTAs, yellow.

3. Add micro-copy throughout in Caveat font as if scribbled in the margins:
   - Next to the price on screen cards: "worth it 💕"
   - Above the romantic setup add-on: "this one's special"
   - Next to "book now" buttons in different spots: "yes do it", "let's gooo", "you won't regret it"
   - These should appear with a slight bounce on scroll-in, disappear on scroll-out (bidirectional)

4. Footer treatment:
   - Before the black footer, add a "torn paper" SVG edge so the footer looks ripped from above
   - Footer has a subtle starry night background pattern (small dot pattern, very low opacity)
   - Logo at the top of footer with a small handwritten "let's vibe, again soon 💕" caption

---

STEP 9 — Verification

1. Build: npm run build must succeed
2. Walkthrough: scroll the entire page top to bottom — should feel like one continuous experience, no jarring breaks
3. Scroll back up: every animation that played should visually reverse
4. Romantic moments are clearly present but don't overpower the funk
5. Photos are integrated, not pasted on
6. Mobile: smooth, no jank, layout adapted not just resized
7. Take a 10-second screen recording scrolling down then back up — share it with me

DO NOT:
- Add new colors outside the brand palette
- Use heavy parallax that makes scroll feel laggy
- Lose the sticker aesthetic in pursuit of "professional" — the brand stays funky, it just becomes funky AND romantic AND continuous
- Make the romantic section feel like a different website — it's the same site, just whispering instead of shouting at that moment
- Skip the bidirectional animation refactor — this is the #1 priority, not optional

Show me screenshots after build:
- Hero with mid-scroll state (some animation in progress)
- Screens section with the stack-and-fan moment mid-animation
- The new romantic section
- The polaroid gallery
- A section transition zone showing two sections bleeding into each other
- Mobile view of the romantic section
```

---

## Why these three things together

**Continuous flow** comes from one shared scrolling background + parallax layers + intentional overlap zones. Once you remove the per-section background colors and let elements bleed past their containers, the seams vanish.

**Romanticism** isn't replacing the funk — it's a counter-melody. Loud sticker → soft romantic moment → loud sticker. The contrast is what makes both work. Without quiet moments the loud moments lose their impact.

**Bidirectional animations** are technically the simplest fix but the most impactful for "premium feel." It's almost always a swap from `useInView({ once: true })` to `useScroll + useTransform`. Once Claude Code does the refactor pattern in one component, it can replicate across all of them.

**Run order:** v1 first (sticker overhaul), confirm it works, then v2. Don't merge them — v2 explicitly refactors v1's animations.
